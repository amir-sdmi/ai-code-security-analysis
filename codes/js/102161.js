"use client";

import React, { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { useUserAuth } from "../_utils/auth-context";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useLanguage } from "../_utils/LanguageContext";

const Allstats = () => {
  const { user, gitHubSignIn, firebaseSignOut } = useUserAuth();
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateRange, setSelectedDateRange] = useState([null, null]);
  const [startDate, endDate] = selectedDateRange;
  const { t } = useLanguage();

  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    // If user is not logged in, redirect to login page
    if (!user) {
      router.push("/");
    } else {
      setIsLoading(false); // User is authenticated, no longer loading
    }
  }, [user, router]);

  useEffect(() => {
    const fetchOrders = async () => {
      const db = getFirestore();
      const ordersRef = collection(db, "transactions");

      try {
        let querySnapshot;
        if (selectedDate) {
          const startOfDay = new Date(selectedDate);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(selectedDate);
          endOfDay.setHours(23, 59, 59, 999);

          const startOfDayISO = startOfDay.toISOString();
          const endOfDayISO = endOfDay.toISOString();

          querySnapshot = await getDocs(
            query(
              ordersRef,
              where("transaction_time", ">=", startOfDayISO),
              where("transaction_time", "<=", endOfDayISO)
            )
          );
        } else if (startDate && endDate) {
          const startOfDayISO = startDate.toISOString();
          const endOfDayISO = endDate.toISOString();

          querySnapshot = await getDocs(
            query(
              ordersRef,
              where("transaction_time", ">=", startOfDayISO),
              where("transaction_time", "<=", endOfDayISO)
            )
          );
        } else {
          querySnapshot = await getDocs(ordersRef);
        }

        const ordersData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(
          ordersData.sort(
            (a, b) =>
              new Date(b.transaction_time) - new Date(a.transaction_time)
          )
        );
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };

    fetchOrders();
  }, [selectedDate, startDate, endDate]);

  const handleShowOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleCloseOrderDetails = () => {
    setShowOrderDetails(false);
    setSelectedOrder(null);
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      const db = getFirestore();
      const orderRef = doc(db, "transactions", orderId);

      try {
        await deleteDoc(orderRef);
        setOrders(orders.filter((order) => order.id !== orderId));
        console.log("Order deleted successfully!");
      } catch (error) {
        console.error("Error deleting order:", error);
      }
    }
  };

  const handleTodayTransactions = () => {
    const today = new Date();
    setSelectedDate(today);
    setSelectedDateRange([null, null]);
  };

  const handleLast7DaysTransactions = () => {
    const today = new Date();
    const last7Days = new Date(today);
    last7Days.setDate(today.getDate() - 7);
    setSelectedDateRange([last7Days, today]);
    setSelectedDate(null);
  };

  const handleMonthTransactions = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    setSelectedDateRange([startOfMonth, today]);
    setSelectedDate(null);
  };

  if (isLoading) {
    return <div className="text-white text-xl">{t("loading")}</div>; // Or a loading spinner, etc.
  }

  // To generate PDF report, assisted by chatgpt and copilot
  const generatePdfReport = () => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text("Transaction Report", 14, 22);

    // Add date range
    doc.setFontSize(12);
    const dateRangeText = selectedDate
      ? `Date: ${selectedDate.toLocaleDateString("en-US")}`
      : startDate && endDate
      ? `Date Range: ${startDate.toLocaleDateString(
          "en-US"
        )} - ${endDate.toLocaleDateString("en-US")}`
      : "All Transactions";
    doc.text(dateRangeText, 14, 32);

    // Add table
    const tableData = orders.map((order) => [
      order.order_id,
      order.user_name,
      new Date(order.transaction_time).toLocaleDateString("en-US"),
      new Date(order.transaction_time).toLocaleTimeString("en-US"),
      `$${order.total_amount.toFixed(2)}`,
    ]);

    doc.autoTable({
      head: [["Order ID", "User", "Date", "Time", "Total Amount"]],
      body: tableData,
      startY: 40,
    });

    // Save the PDF
    doc.save("transaction_report.pdf");
  };

  return (
    <div className="order-page">
      <header className="bg-gray-800 text-white py-4 px-6 flex justify-between items-center top-0 z-10">
        <h1 className="text-xl font-semibold">{t("stats")} </h1>
      </header>
      <div className="flex items-center space-x-4">
        <div>
          <label
            htmlFor="datePicker"
            className="text-sm font-medium text-white mr-2"
          >
            {t("selectDate")}:
          </label>
          <DatePicker
            id="datePicker"
            selected={selectedDate}
            onChange={(date) => {
              setSelectedDate(date);
              setSelectedDateRange([null, null]);
            }}
            dateFormat="yyyy-MM-dd"
            placeholderText={t("selectDate")}
            className="py-1 px-2 border text-black border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="dateRangePicker"
            className="text-sm font-medium text-white mr-2"
          >
            {t("selectDateRange")}:
          </label>
          <DatePicker
            id="dateRangePicker"
            selected={startDate}
            onChange={(dates) => {
              const [start, end] = dates;
              setSelectedDateRange([start, end]);
              setSelectedDate(null);
            }}
            startDate={startDate}
            endDate={endDate}
            selectsRange
            dateFormat="yyyy-MM-dd"
            placeholderText={t("selectDateRange")}
            className="py-1 px-2 border text-black border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
        </div>
        <button
          onClick={handleTodayTransactions}
          className="bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600 transition-colors duration-300"
        >
          {t("today")}
        </button>
        <button
          onClick={handleLast7DaysTransactions}
          className="bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600 transition-colors duration-300"
        >
          {t("last7Days")}
        </button>
        <button
          onClick={handleMonthTransactions}
          className="bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600 transition-colors duration-300"
        >
          {t("thisMonth")}
        </button>
      </div>

      <div className="flex justify-end mt-4 mr-6">
        <button
          onClick={generatePdfReport}
          className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors duration-300"
        >
          {t("generateReport")}
        </button>
      </div>
      <div className="orders-container p-6">
        {orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-800 text-white">
                  <th className="px-4 py-2">{t("orderId")}</th>
                  <th className="px-4 py-2">{t("user")}</th>
                  <th className="px-4 py-2">{t("date")}</th>
                  <th className="px-4 py-2">{t("time")}</th>
                  <th className="px-4 py-2">{t("totalAmount")}</th>
                  <th className="px-4 py-2">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-gray-700 hover:bg-gray-800 cursor-pointer"
                    onClick={() => handleShowOrderDetails(order)}
                  >
                    <td className="px-4 py-2 text-white">{order.order_id}</td>
                    <td className="px-4 py-2 text-white">{order.user_name}</td>
                    <td className="px-4 py-2 text-white">
                      {new Date(order.transaction_time).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-white">
                      {new Date(order.transaction_time).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-2 text-white">
                      ${order.total_amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-white">
                      <button
                        className="bg-red-500 text-white px-2 py-1 rounded-md hover:bg-red-600 transition-colors duration-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteOrder(order.id);
                        }}
                      >
                        X
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">{t("noOrdersFound")}</p>
        )}
      </div>
      {showOrderDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg text-black">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">{t("orderDetails")}</h2>
              <p>
                {t("orderId")}: {selectedOrder.order_id}
              </p>
              <p>
                {t("user")}: {selectedOrder.user_name}
              </p>
              <p>
                {t("date")}:{" "}
                {new Date(selectedOrder.transaction_time).toLocaleString()}
              </p>
            </div>
            <div className="mb-4">
              <h3 className="text-md font-semibold mb-2">
                {t("orderSummary")}:
              </h3>
              <ul>
                {selectedOrder.order_items.map((item, index) => (
                  <li key={index}>
                    {item.item_name} x {item.quantity}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-between">
              <div>
                <p>
                  {t("totalAmount")}: ${selectedOrder.total_amount.toFixed(2)}
                </p>
                <p>
                  {t("cash")}: ${selectedOrder.cash_amount.toFixed(2)}
                </p>
                <p>
                  {t("voucher")}: ${selectedOrder.voucher_amount.toFixed(2)}
                </p>
              </div>
            </div>
            <button
              className="bg-gray-500 text-white px-4 py-2 rounded-md mt-4 hover:bg-gray-600 transition-colors duration-300"
              onClick={handleCloseOrderDetails}
            >
              {t("close")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Allstats;
