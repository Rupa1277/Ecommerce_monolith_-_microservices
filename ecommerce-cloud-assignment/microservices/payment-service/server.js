const express=require('express'),cors=require('cors'),{Pool}=require('pg');
const app=express();app.use(cors(),express.json());
const db=new Pool({connectionString:process.env.DATABASE_URL});
async function ready(sql){for(let i=0;i<30;i++){try{await db.query(sql);return}catch(e){console.log('waiting for DB...');await new Promise(r=>setTimeout(r,2000))}}throw new Error('DB not reachable')}
const SEED="INSERT INTO products(name,price,description,emoji) SELECT v.* FROM (VALUES ('Laptop',55000,'14 inch, 16GB RAM','💻'),('Smartphone',20000,'5G, 128GB','📱'),('Headphones',2500,'Wireless, noise cancelling','🎧'),('Smart Watch',4000,'Fitness tracking','⌚'),('Backpack',1200,'Water resistant','🎒'),('Keyboard',1800,'Mechanical RGB','⌨️')) AS v(name,price,description,emoji) WHERE NOT EXISTS (SELECT 1 FROM products);";

// PAYMENT SERVICE (own DB: paymentdb) - calls Cart service over HTTP
const CART=process.env.CART_SERVICE_URL;
app.post('/api/payment',async(q,r)=>{
  try{
    const items=await (await fetch(CART+'/api/cart')).json();
    if(!items.length)return r.status(400).json({error:'Cart is empty'});
    const total=items.reduce((s,i)=>s+i.price*i.qty,0);
    const o=await db.query('INSERT INTO orders(customer,total) VALUES($1,$2) RETURNING id',[q.body.name,total]);
    await fetch(CART+'/api/cart',{method:'DELETE'});
    r.json({orderId:o.rows[0].id,total});
  }catch(e){r.status(500).json({error:e.message})}
});
ready('CREATE TABLE IF NOT EXISTS orders(id SERIAL PRIMARY KEY,customer TEXT,total INT,created_at TIMESTAMP DEFAULT now())')
 .then(()=>app.listen(3000,()=>console.log('Payment service on 3000')));
