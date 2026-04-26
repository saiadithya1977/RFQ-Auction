import prisma from "../utils/prisma.js";


export const createRFQ = async (req, res, next) => {
  try {
    const {
      name,
      bidStartTime,
      bidCloseTime,
      forcedCloseTime,
      triggerWindow,
      extensionDuration,
      extensionType,
      pickupDate,
    } = req.body;

    if (!name || !bidStartTime || !bidCloseTime || !forcedCloseTime || !pickupDate) {
      return res.status(400).json({
        success: false,
        message: "Missing fields",
      });
    }

    const now = new Date();

    if (new Date(bidStartTime) < now) {
      return res.status(400).json({
        success: false,
        message: "Start time must be in future",
      });
    }

    if (new Date(bidCloseTime) <= new Date(bidStartTime)) {
      return res.status(400).json({
        success: false,
        message: "Close must be after start",
      });
    }

    if (new Date(forcedCloseTime) <= new Date(bidCloseTime)) {
      return res.status(400).json({
        success: false,
        message: "Forced close must be after bid close",
      });
    }

    if(new Date(pickupDate) <= new Date(forcedCloseTime)){
      return res.status(400).json({
        success:false,
        message:"Pickup Date/Time should be after bid completion"
      })
    }

    const rfq = await prisma.rFQ.create({
      data: {
        name,
        bidStartTime: new Date(bidStartTime),
        bidCloseTime: new Date(bidCloseTime),
        forcedCloseTime: new Date(forcedCloseTime),
        pickupDate: new Date(pickupDate),
        triggerWindow,
        extensionDuration,
        extensionType,
        buyerId: req.user.id,
      },
    });

    res.json({ success: true, data: rfq });
  } catch (err) {
    next(err);
  }
};


export const getAllRFQs = async (req, res, next) => {
  try {
    const rfqs = await prisma.rFQ.findMany({
      include: {
        bids: {
          orderBy: { totalAmount: "asc" }, // ✅ FIXED
        },
      },
    });

    res.json({
      success: true,
      data: rfqs,
    });
  } catch (err) {
    next(err);
  }
};


export const getRFQById = async (req, res, next) => {
  try {
    const rfq = await prisma.rFQ.findUnique({
      where: { id: req.params.id },
      include: {
        bids: {
          orderBy: { totalAmount: "asc" }, // ✅ FIXED
        },
      },
    });

    if (!rfq) {
      return res.status(404).json({
        success: false,
        message: "RFQ not found",
      });
    }

    const bidsWithRank = rfq.bids.map((b, i) => ({
      ...b,
      rank: `L${i + 1}`,
    }));

    res.json({
      success: true,
      data: { ...rfq, bids: bidsWithRank },
    });
  } catch (err) {
    next(err);
  }
};