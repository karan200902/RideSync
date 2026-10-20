import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/database.js";

const fields = ["transactionId", "razorpayOrderId", "razorpayPaymentId"];

const run = async () => {
  await connectDB();
  const collection = mongoose.connection.collection("payments");

  try {
    const indexes = await collection.indexes();

    for (const field of fields) {
      for (const index of indexes) {
        if (index.name === "_id_" || !index.key || index.key[field] !== 1) {
          continue;
        }

        const partialType = index.partialFilterExpression?.[field]?.$type;
        const isCorrectPartialIndex = index.unique === true && partialType === "string";

        if (index.unique && !isCorrectPartialIndex) {
          console.log(`Dropping obsolete unique index: ${index.name}`);
          await collection.dropIndex(index.name);
        }
      }

      const current = (await collection.indexes()).find(
        (index) => index.key?.[field] === 1 && index.unique === true,
      );
      if (!current || current.partialFilterExpression?.[field]?.$type !== "string") {
        console.log(`Creating partial unique index for ${field}`);
        await collection.createIndex(
          { [field]: 1 },
          {
            name: `${field}_1`,
            unique: true,
            partialFilterExpression: { [field]: { $type: "string" } },
          },
        );
      } else {
        console.log(`Index already correct for ${field}: ${current.name}`);
      }
    }

    console.log("Payment indexes are ready.");
  } finally {
    await mongoose.disconnect();
  }
};

run().catch((error) => {
  console.error("Failed to fix payment indexes:", error);
  process.exitCode = 1;
});
