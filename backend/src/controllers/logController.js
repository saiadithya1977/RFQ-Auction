import prisma from "../utils/prisma.js";

export const getLogs = async (req, res, next) => {
  try {
    const logs = await prisma.activityLog.findMany({
      where: { rfqId: req.params.rfqId },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      data: logs,
    });
  } catch (err) {
    next(err);
  }
};