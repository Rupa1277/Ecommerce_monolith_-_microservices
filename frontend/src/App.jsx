import {useState,useEffect} from 'react'
const api=(p,o)=>fetch('/api'+p,o).then(r=>r.json())
const post=(p,b)=>api(p,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)})

export default function App(){
  const [page,setPage]=useState('home')
  const [products,setProducts]=useState([])
  const [cart,setCart]=useState([])
  const [msg,setMsg]=useState('')
  const [form,setForm]=useState({name:'',card:''})
  const load=()=>{api('/products').then(setProducts).catch(()=>{});api('/cart').then(setCart).catch(()=>{})}
  useEffect(()=>{load()},[])
  const total=cart.reduce((s,i)=>s+i.price*i.qty,0)
  const add=async p=>{await post('/cart',{product_id:p.id,name:p.name,price:p.price});load()}
  const remove=async id=>{await api('/cart/'+id,{method:'DELETE'});load()}
  const pay=async e=>{e.preventDefault();const r=await post('/payment',form)
    setMsg(r.error?('Error: '+r.error):`Payment successful! Order #${r.orderId} - Rs.${r.total} paid by ${form.name}`);load()}
  return(<div>
    <nav><b>🛒 ShopEasy</b>
      {['home','products','cart','payment'].map(p=>
        <button key={p} className={page===p?'on':''} onClick={()=>setPage(p)}>
          {p[0].toUpperCase()+p.slice(1)}{p==='cart'?` (${cart.length})`:''}</button>)}
    </nav>
    <main>
      {page==='home'&&<div><h1>Welcome to ShopEasy</h1><p>Cloud Computing Assignment 1 - E-commerce demo.</p>
        <button className="btn" onClick={()=>setPage('products')}>Shop Now</button></div>}
      {page==='products'&&<div><h2>Products</h2><div className="grid">{products.map(p=>
        <div className="card" key={p.id}><div className="e">{p.emoji}</div><h3>{p.name}</h3>
        <p>{p.description}</p><b>Rs. {p.price}</b><br/><br/>
        <button className="btn" onClick={()=>add(p)}>Add to Cart</button></div>)}</div></div>}
      {page==='cart'&&<div><h2>Your Cart</h2>{cart.length===0&&<p>Cart is empty.</p>}
        {cart.map(i=><div className="row" key={i.id}><span>{i.name} x {i.qty}</span>
          <span>Rs. {i.price*i.qty} <button className="btn" onClick={()=>remove(i.id)}>Remove</button></span></div>)}
        <h3>Total: Rs. {total}</h3>
        {cart.length>0&&<button className="btn" onClick={()=>setPage('payment')}>Proceed to Payment</button>}</div>}
      {page==='payment'&&<div><h2>Payment</h2><h3>Amount: Rs. {total}</h3>
        <form onSubmit={pay}>
          <input required placeholder="Name on card" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
          <input required placeholder="Card number (dummy)" value={form.card} onChange={e=>setForm({...form,card:e.target.value})}/>
          <button className="btn" type="submit">Pay Now</button></form>
        {msg&&<div className="ok">{msg}</div>}</div>}
    </main></div>)
}
