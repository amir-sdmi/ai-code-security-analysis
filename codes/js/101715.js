import Card from "@/components/Card/Card";
import styles from "./page.module.css";
import formStyles from "@/public/styles/form.module.css";
import AdminPageHeading from "@/components/Utils/AdminPageHeading";
import Link from "next/link";
import dbConnect from "@/helpers/dbConnect";
import { deepCopy, formatDate } from "@/helpers/utils";
import Order from "@/models/Order";
import DiscountCoupon from "@/models/DiscountCoupon";

export const metadata = {
  title: "Coupon Details",
  description: "Coupon details page for admin",
};

async function fetchCoupon(couponCode) {
  try {
    await dbConnect();
  } catch (error) {
    return null;
  }

  try {
    const coupon = await DiscountCoupon.findOne({
      code: couponCode,
    }).lean();

    if (!coupon) {
      return null;
    }

    // this logic was written by ChatGPT
    const orders = await Order.aggregate([
      {
        $match: {
          $or: [
            { coupon: couponCode }, // Match orders where the whole order coupon is FREE100
            { "items.coupon": couponCode }, // Match orders where any item uses FREE100 coupon
          ],
        },
      },
      {
        $project: {
          _id: 1, // Keep the order ID
          no_of_products_which_used_this_coupon: {
            // Start by counting products in the items array where the coupon is FREE100
            $add: [
              {
                $size: {
                  $filter: {
                    input: "$items",
                    as: "item",
                    cond: { $eq: ["$$item.coupon", couponCode] },
                  },
                },
              },
              {
                // If the whole order coupon matches, increment by 1
                $cond: {
                  if: { $eq: ["$coupon", couponCode] },
                  then: 1,
                  else: 0,
                },
              },
            ],
          },
          total_deducted_amount: {
            // Start by summing the discountAmount for items where coupon is FREE100
            $add: [
              {
                $sum: {
                  $map: {
                    input: {
                      $filter: {
                        input: "$items",
                        as: "item",
                        cond: { $eq: ["$$item.coupon", couponCode] },
                      },
                    },
                    as: "item",
                    in: "$$item.discountAmount",
                  },
                },
              },
              {
                // Add the order discountAmount if the whole order coupon matches
                $cond: {
                  if: { $eq: ["$coupon", couponCode] },
                  then: "$discountAmount",
                  else: 0,
                },
              },
            ],
          },
        },
      },
    ]);
    coupon.orders = orders;
    return deepCopy(coupon);
  } catch (error) {
    return null;
  }
}

export default async function Dashboard({ params: { couponCode } }) {
  const coupon = await fetchCoupon(couponCode);

  return (
    <div className={styles.container}>
      <AdminPageHeading back className={styles.title}>
        {couponCode} Coupon Details
        <Link
          className={`${formStyles.btn} ${styles.editBtn}`}
          href={`/admin/new-coupon?coupon=${couponCode}`}
        >
          Edit Coupon
        </Link>
      </AdminPageHeading>
      <div className={styles.cardWrapper}>
        <Card className={`${styles.card} ${styles.orderInfo}`}>
          <span className={styles.cardTitle}>Used History</span>
          {coupon?.orders?.length === 0 && (
            <p className={styles.fallback}>
              Customer doesnot have any orders yet.
            </p>
          )}

          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.order_number}>Order number</th>
                <th className={styles.no_of_products}>Products with coupon</th>
                <th className={styles.total}>Deducted amount</th>
              </tr>
            </thead>
            <tbody>
              {coupon?.orders.map?.((order, index) => (
                <tr key={order?._id}>
                  <td className={styles.order_number}>
                    <Link href={`/admin/orders/${index}`}>{order?._id}</Link>
                  </td>
                  <td className={styles.no_of_products}>
                    {order?.no_of_products_which_used_this_coupon}
                  </td>
                  <td className={styles.total}>
                    Rs. {order?.total_deducted_amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card className={`${styles.card} ${styles.couponInfo}`}>
          <h1>Coupon Code</h1>
          <p>{coupon?.code}</p>
          <h1>Discount</h1>
          <p>
            {coupon?.discountType === "PERCENTAGE"
              ? `${coupon?.discountValue}% max upto ${coupon?.maxDiscountAmount}`
              : `Rs ${coupon?.discountAmount}`}
          </p>
          <h1>Applicable on</h1>
          <p>{coupon?.applicableOn}</p>
          <h1>Coupon Scope</h1>
          <p>
            {coupon?.scope === "INDIVIDUAL"
              ? "It is applicable on product individually"
              : "It is applicable on whole order"}
          </p>
          <h1>Free shipping?</h1>
          <p>{coupon?.freeShipping ? "Yes" : "No"}</p>
          <h1>Start date</h1>
          <p>{formatDate(coupon?.validFrom)}</p>
          <h1>End date</h1>
          <p>{formatDate(coupon?.validUntil)}</p>
          <h1>Status</h1>
          <p>{coupon?.isActive ? "Active" : "Disabled"}</p>
        </Card>
      </div>
    </div>
  );
}
