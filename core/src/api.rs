use std::sync::Arc;
use std::sync::RwLock;
use std::collections::HashMap;
use std::ops::Add;
use ws::Sender;
use ws::listen;

pub struct Ws {
    pub ip: String,
    pub port: u32,
}

impl Ws {

    pub fn new(
        ip: String,
        port: u32,
    ) -> Ws {
        Ws {
            ip,
            port
        }
    }

    pub fn run(&self){
        let endpoint: String = self.ip.clone().add(":").add(self.port.to_string().as_ref());
        listen(endpoint, |out: Sender| {
            move |msg| {
                out.send(msg)
            }
        }).unwrap();
    }
}

