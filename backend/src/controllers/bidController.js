import prisma from "../utils/prisma.js";

export const placeBid = async (req, res, next) => {
  try {
    const {
      rfqId,
      carrierName,
      freightCharges,
      originCharges,
      destinationCharges,
      transitTime,
      validity
    } = req.body;

    if (
      isNaN(freightCharges) ||
      isNaN(originCharges) ||
      isNaN(destinationCharges)
    ) {
      return res.status(400).json({
        success: false,
        message: "Charges must be valid numbers",
      });
    }

    if (freightCharges < 0 || originCharges < 0 || destinationCharges < 0) {
      return res.status(400).json({
        success: false,
        message: "Charges cannot be negative",
      });
    }

    const userId = req.user.id;

    if (!carrierName || !freightCharges) {
      return res.status(400).json({
        success: false,
        message: "Invalid quote",
      });
    }

    const totalAmount =
      Number(freightCharges) +
      Number(originCharges) +
      Number(destinationCharges);

    const rfq = await prisma.rFQ.findUnique({
      where: { id: rfqId },
    });

    if (!rfq) {
      return res.status(404).json({
        success: false,
        message: "RFQ not found",
      });
    }

    const now = new Date();

    if (now < rfq.bidStartTime) {
      return res.status(400).json({
        success: false,
        message: "Auction not started",
      });
    }

    if (now > rfq.forcedCloseTime) {
      return res.status(400).json({
        success: false,
        message: "Auction closed",
      });
    }

    const sortedBids = await prisma.bid.findMany({
      where: { rfqId },
      orderBy: { totalAmount: "asc" },
    });

    const lowest = sortedBids[0];

    if (lowest && totalAmount >= lowest.totalAmount) {
      return res.status(400).json({
        success: false,
        message: "Quote must be lower than current lowest",
      });
    }

    const oldOrder = sortedBids.map((b) => b.supplierId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    const bid = await prisma.bid.create({
      data: {
        rfqId,
        supplierId: userId,
        carrierName,
        freightCharges: Number(freightCharges),
        originCharges: Number(originCharges),
        destinationCharges: Number(destinationCharges),
        transitTime,
        validity,
        totalAmount,
      },
    });

    await prisma.activityLog.create({
      data: {
        rfqId,
        type: "BID",
        message: `${user.name} placed quote of ₹${totalAmount}`,
      },
    });

    const updatedBids = await prisma.bid.findMany({
      where: { rfqId },
      orderBy: { totalAmount: "asc" },
    });

    const newOrder = updatedBids.map((b) => b.supplierId);

    const rankChanged =
      oldOrder.join(",") !== newOrder.slice(0, oldOrder.length).join(",");

    const triggerTime = new Date(
      rfq.bidCloseTime.getTime() - rfq.triggerWindow * 60000
    );

    const isInWindow = now >= triggerTime;

    let shouldExtend = false;
    let reason = "";

    if (isInWindow) {
      if (rfq.extensionType === "ANY_BID") {
        shouldExtend = true;
        reason = "Bid in trigger window";
      }

      if (rfq.extensionType === "ANY_RANK_CHANGE" && rankChanged) {
        shouldExtend = true;
        reason = "Rank changed";
      }

      if (rfq.extensionType === "L1_CHANGE") {
        const oldL1 = sortedBids[0];
        const newL1 = updatedBids[0];

        if (oldL1?.supplierId !== newL1?.supplierId) {
          shouldExtend = true;
          reason = "L1 changed";
        }
      }
    }

    let newCloseTime = rfq.bidCloseTime;

    if (shouldExtend) {
      const extended = new Date(
        rfq.bidCloseTime.getTime() + rfq.extensionDuration * 60000
      );

      newCloseTime =
        extended < rfq.forcedCloseTime
          ? extended
          : rfq.forcedCloseTime;

      await prisma.rFQ.update({
        where: { id: rfqId },
        data: { bidCloseTime: newCloseTime },
      });

      await prisma.activityLog.create({
        data: {
          rfqId,
          type: "EXTENSION",
          message: `Auction extended to ${newCloseTime} because ${reason}`,
        },
      });
    }

    req.app.get("io").to(rfqId).emit("bid_update");

    res.json({
      success: true,
      data: { bid, newCloseTime },
    });

  } catch (err) {
    next(err);
  }
};