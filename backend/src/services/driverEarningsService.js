
import DriverProfile from "../models/DriverProfile.js";
import Payment from "../models/Payment.js";
import AppError from "../utils/AppError.js";

export const getDriverEarnings = async (
    driverUserId,
    page = 1,
    limit = 10,
    status,
) => {
    const driver = await DriverProfile.findOne({
        user: driverUserId,
    }).select("_id totalEarnings totalRides");

    if (!driver) {
        throw new AppError("Driver profile not found", 404);
    }

    const paymentFilter = { driver: driver._id };

    if (status) {
        const allowedStatuses = [
            "PENDING",
            "PROCESSING",
            "SUCCESS",
            "FAILED",
            "REFUNDED",
        ];

        if (!allowedStatuses.includes(status)) {
            throw new AppError("Invalid payment status filter", 400);
        }

        paymentFilter.status = status;
    }

    const skip = (page - 1) * limit;

    const [summaryResult, statusCounts, payments, total] =
        await Promise.all([
            Payment.aggregate([
                { $match: { driver: driver._id } },
                {
                    $group: {
                        _id: null,
                        totalPaid: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$status", "SUCCESS"] },
                                    "$amount",
                                    0,
                                ],
                            },
                        },
                        paidTrips: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$status", "SUCCESS"] },
                                    1,
                                    0,
                                ],
                            },
                        },
                        pendingPayments: {
                            $sum: {
                                $cond: [
                                    {
                                        $in: ["$status", ["PENDING", "PROCESSING"]],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                    },
                },
            ]),
            Payment.aggregate([
                { $match: { driver: driver._id } },
                { $group: { _id: "$status", count: { $sum: 1 } } },
            ]),
            Payment.find(paymentFilter)
                .populate({
                    path: "ride",
                    select:
                        "pickup destination vehicleType status createdAt distance estimatedDuration finalFare",
                })
                .populate("passenger", "name")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Payment.countDocuments(paymentFilter),
        ]);

    const summary = summaryResult[0] ?? {
        totalPaid: 0,
        paidTrips: 0,
        pendingPayments: 0,
    };

    return {
        summary: {
            totalEarned: summary.totalPaid,
            paidTrips: summary.paidTrips,
            pendingPayments: summary.pendingPayments,
            averagePerPaidTrip: summary.paidTrips
                ? Math.round(
                    (summary.totalPaid / summary.paidTrips) * 100,
                ) / 100
                : 0,
            currency: "INR",
        },
        paymentStatusCounts: Object.fromEntries(
            statusCounts.map(({ _id, count }) => [_id, count]),
        ),
        payments,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page * limit < total,
            hasPrevPage: page > 1,
        },
    };
};