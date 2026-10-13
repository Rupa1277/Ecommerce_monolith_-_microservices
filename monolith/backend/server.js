const express=require('express'),cors=require('cors'),{Pool}=require('pg');
const app=express();app.use(cors(),express.json());app.use(express.static(__dirname+'/public'));
const db=new Pool({connectionString:process.env.DATABASE_URL});
async function ready(sql){for(let i=0;i<30;i++){try{await db.query(sql);return}catch(e){console.log('waiting for DB...');await new Promise(r=>setTimeout(r,2000))}}throw new Error('DB not reachable')}
const SEED="INSERT INTO products(name,price,description,emoji) SELECT v.* FROM (VALUES ('Laptop',55000,'14 inch, 16GB RAM','💻'),('Smartphone',20000,'5G, 128GB','📱'),('Headphones',2500,'Wireless, noise cancelling','🎧'),('Smart Watch',4000,'Fitness tracking','⌚'),('Backpack',1200,'Water resistant','🎒'),('Keyboard',1800,'Mechanical RGB','⌨️')) AS v(name,price,description,emoji) WHERE NOT EXISTS (SELECT 1 FROM products);";

// MONOLITH: products + cart + payment in ONE app and ONE database
app.get('/api/products',async(_,r)=>r.json((await db.query('SELECT * FROM products ORDER BY id')).rows));
app.get('/api/cart',async(_,r)=>r.json((await db.query('SELECT * FROM cart ORDER BY id')).rows));
app.post('/api/cart',async(q,r)=>{
  const p=(await db.query('SELECT * FROM products WHERE id=$1',[q.body.product_id])).rows[0];
  if(!p)return r.status(404).json({error:'Product not found'});
  const u=await db.query('UPDATE cart SET qty=qty+1 WHERE product_id=$1 RETURNING *',[p.id]);
  if(!u.rowCount)await db.query('INSERT INTO cart(product_id,name,price,qty) VALUES($1,$2,$3,1)',[p.id,p.name,p.price]);
  r.json({ok:true});
});
app.delete('/api/cart/:id',async(q,r)=>{await db.query('DELETE FROM cart WHERE id=$1',[q.params.id]);r.json({ok:true})});
app.post('/api/payment',async(q,r)=>{
  const items=(await db.query('SELECT * FROM cart')).rows;
  if(!items.length)return r.status(400).json({error:'Cart is empty'});
  const total=items.reduce((s,i)=>s+i.price*i.qty,0);
  const o=await db.query('INSERT INTO orders(customer,total) VALUES($1,$2) RETURNING id',[q.body.name,total]);
  await db.query('DELETE FROM cart');
  r.json({orderId:o.rows[0].id,total});
});
ready(`CREATE TABLE IF NOT EXISTS products(id SERIAL PRIMARY KEY,name TEXT,price INT,description TEXT,emoji TEXT);
CREATE TABLE IF NOT EXISTS cart(id SERIAL PRIMARY KEY,product_id INT,name TEXT,price INT,qty INT);
CREATE TABLE IF NOT EXISTS orders(id SERIAL PRIMARY KEY,customer TEXT,total INT,created_at TIMESTAMP DEFAULT now());`)
 .then(()=>db.query(SEED)).then(()=>app.listen(3000,()=>console.log('Monolith on 3000')));
