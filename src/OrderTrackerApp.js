// src/components/OrdersPanel.tsx
import React, { useEffect, useState } from 'react';

type Product = { id:number, sku:string, name:string, price:number };
type OrderItem = { productId:number, quantity:number };

export default function OrdersPanel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<OrderItem[]>([{productId:0, quantity:1}]);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(()=> {
    fetch('/api/products').then(r=>r.json()).then(setProducts);
    fetch('/api/orders').then(r=>r.json()).then(setOrders);
  }, []);

  function addRow(){
    setItems(prev => [...prev, {productId: products[0]?.id || 0, quantity:1}]);
  }
  function updateRow(index:number, field:'productId'|'quantity', value:any){
    const copy = [...items];
    // @ts-ignore
    copy[index][field] = value;
    setItems(copy);
  }
  async function createOrder(){
    const body = { customerId: 1, items: items.filter(i=>i.productId), shipping: 0 };
    const res = await fetch('/api/orders', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    if(res.ok) {
      alert('Order created');
      const o = await res.json();
      setOrders(prev => [o, ...prev]);
    } else {
      const err = await res.json();
      alert('Error: ' + JSON.stringify(err));
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-3">Create Order</h2>

      <div className="mb-4">
        {items.map((row, idx)=>(
          <div key={idx} className="flex gap-2 mb-2">
            <select value={row.productId} onChange={e=>updateRow(idx,'productId',Number(e.target.value))} className="border p-1 rounded">
              <option value={0}>-- choose --</option>
              {products.map(p => <option value={p.id} key={p.id}>{p.sku} — {p.name} — ${p.price}</option>)}
            </select>
            <input type="number" value={row.quantity} min={1} onChange={e=>updateRow(idx,'quantity',Number(e.target.value))} className="w-20 border p-1 rounded"/>
          </div>
        ))}
        <div className="flex gap-2">
          <button onClick={addRow} className="px-3 py-1 rounded bg-gray-200">Add item</button>
          <button onClick={createOrder} className="px-3 py-1 rounded bg-blue-600 text-white">Create order</button>
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-2">Recent Orders</h3>
      <ul>
        {orders.map(o=>(
          <li key={o.id} className="p-2 border rounded mb-2">
            <div>Order #{o.id} — {o.status} — ${o.total}</div>
            <div className="text-sm text-gray-600">Created: {new Date(o.created_at).toLocaleString()}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
