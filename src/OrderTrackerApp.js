// Printing Shop Order Tracker with Loyalty, Segments & Analytics
// Added features:
// - Loyalty points (earn on each order)
// - Customer segments (New, Returning, Frequent, VIP)
// - Analytics dashboard (totals, repeat rate, top customers)
// - All previous features preserved

import React, { useEffect, useState } from "react";

const uid = () => Math.random().toString(36).slice(2, 9);
const STORAGE_KEY = "printing_orders_v3";

export default function OrderTrackerApp() {
  const [orders, setOrders] = useState([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  // form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [details, setDetails] = useState("");

  // customer popup
  const [customerView, setCustomerView] = useState(null);

  // analytics view
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setOrders(JSON.parse(raw));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  }, [orders]);

  // ---------------- CUSTOMER FUNCTIONS ----------------
  function lookupCustomer(number) {
    const list = orders.filter((o) => o.phone === number);
    if (list.length === 0) return null;

    const totalOrders = list.length;
    const completedOrders = list.filter((o) => o.completed).length;
    const loyalty = completedOrders * 5; // 5 points per completed order

    // Segment rules
    let segment = "New";
    if (totalOrders >= 2) segment = "Returning";
    if (totalOrders >= 5) segment = "Frequent";
    if (totalOrders >= 12) segment = "VIP";

    return {
      name: list[list.length - 1].customerName,
      phone: number,
      history: list,
      loyalty,
      segment,
      totalOrders,
    };
  }

  function onPhoneChange(v) {
    setPhone(v);
    if (v.length >= 4) {
      const c = lookupCustomer(v);
      if (c) setName(c.name || "");
    }
  }

  // ---------------- ADD ORDER ----------------
  function addOrder(e) {
    e.preventDefault();
    if (!phone.trim()) return alert("Phone number required");

    const order = {
      id: uid(),
      customerName: name || "-",
      phone: phone.trim(),
      details: details.trim(),
      dateReceived: new Date().toISOString(),
      completed: false,
      pickedUp: false,
      completedAt: null,
      pickedAt: null,
    };

    setOrders((s) => [order, ...s]);
    setName("");
    setPhone("");
    setDetails("");
  }

  // ---------------- STATUS HANDLING ----------------
  function toggleCompleted(id) {
    setOrders((s) =>
      s.map((o) =>
        o.id === id
          ? {
              ...o,
              completed: !o.completed,
              completedAt: !o.completed ? new Date().toISOString() : null,
              pickedUp: !o.completed ? o.pickedUp : false,
              pickedAt: !o.completed ? o.pickedAt : null,
            }
          : o
      )
    );
  }

  function togglePickedUp(id) {
    setOrders((s) =>
      s.map((o) =>
        o.id === id
          ? {
              ...o,
              pickedUp: !o.pickedUp && o.completed ? true : false,
              pickedAt: !o.pickedUp && o.completed ? new Date().toISOString() : null,
            }
          : o
      )
    );
  }

  function removeOrder(id) {
    if (!confirm("Delete order?")) return;
    setOrders((s) => s.filter((o) => o.id !== id));
  }

  // ---------------- FILTERS ----------------
  function filtered() {
    let list = orders;
    const q = query.toLowerCase();
    if (q)
      list = list.filter(
        (o) =>
          o.phone.includes(q) ||
          (o.customerName || "").toLowerCase().includes(q) ||
          (o.details || "").toLowerCase().includes(q)
      );

    if (filter === "new") list = list.filter((o) => !o.completed);
    if (filter === "completed") list = list.filter((o) => o.completed);
    if (filter === "picked") list = list.filter((o) => o.pickedUp);
    if (filter === "onshelf") list = list.filter((o) => o.completed && !o.pickedUp);

    return list;
  }

  // ---------------- SUMMARY ----------------
  const total = orders.length;
  const completedCount = orders.filter((o) => o.completed).length;
  const pickedCount = orders.filter((o) => o.pickedUp).length;
  const onShelf = orders.filter((o) => o.completed && !o.pickedUp).length;

  // ---------------- ANALYTICS ----------------
  const uniqueCustomers = new Set(orders.map((o) => o.phone)).size;
  const repeatCustomers = [...new Set(orders.map((o) => o.phone))].filter(
    (p) => orders.filter((o) => o.phone === p).length >= 2
  ).length;

  const topCustomers = Object.values(
    orders.reduce((acc, o) => {
      acc[o.phone] = acc[o.phone] || { phone: o.phone, count: 0, name: o.customerName };
      acc[o.phone].count++;
      return acc;
    }, {})
  ).sort((a, b) => b.count - a.count);

  function openCustomer(number) {
    const c = lookupCustomer(number);
    if (!c) return;
    setCustomerView(c);
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Printing Shop — Order Tracker + Loyalty + Analytics</h1>

      <button
        className="mb-4 px-4 py-2 bg-purple-600 text-white rounded"
        onClick={() => setShowStats(!showStats)}
      >
        {showStats ? "Hide Analytics" : "Show Analytics"}
      </button>

      {/* Analytics Dashboard */}
      {showStats && (
        <div className="bg-white p-4 rounded shadow mb-6">
          <h2 className="font-semibold text-lg mb-3">Analytics Dashboard</h2>
          <p>Total Orders: <b>{total}</b></p>
          <p>Total Customers: <b>{uniqueCustomers}</b></p>
          <p>Repeat Customers: <b>{repeatCustomers}</b></p>
          <p>Repeat Rate: <b>{uniqueCustomers ? Math.round((repeatCustomers / uniqueCustomers) * 100) : 0}%</b></p>

          <h3 className="font-semibold mt-3">Top Customers</h3>
          <ul className="list-disc ml-5 text-sm">
            {topCustomers.slice(0, 5).map((c) => (
              <li key={c.phone}>{c.name} — {c.count} orders</li>
            ))}
          </ul>
        </div>
      )}

      {/* Add Order */}
      <form onSubmit={addOrder} className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex gap-2 mb-2">
          <input
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="Phone (required)"
            className="w-40 p-2 border rounded"
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Customer name"
            className="flex-1 p-2 border rounded"
          />
        </div>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Order details"
          className="w-full p-2 border rounded mb-2"
        />
        <button className="px-4 py-2 bg-blue-600 text-white rounded">Add Order</button>
      </form>

      {/* Filters */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="p-2 border rounded w
