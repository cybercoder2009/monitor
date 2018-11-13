use std::sync::Arc;
use std::sync::RwLock;
use std::collections::HashMap;
use std::ops::Add;
use ws::Sender;
use ws::listen;

pub fn run(
    ip: String,
    port: u16,
    _conns: Arc<RwLock<HashMap<u32, Sender>>>,
    _pool_status: Arc<RwLock<PoolStatus>>
){
    let endpoint: String = ip.add(":").add(port.to_string().as_ref());
    listen(endpoint, |out: Sender| {
        move |msg| {
            out.send(msg)
        }
    }).unwrap();
}