use std::sync::Arc;
use std::thread;
use std::time::Duration;
use std::ops::Add;
use ws::WebSocket;
use p2p::P2p;
use types::Node;
use serde_json::to_string;


pub struct Ws {
    pub ip: String,
    pub port: u32,
    pub p2p: Arc<P2p>,
}

impl Ws {

    pub fn new(
        ip: String,
        port: u32,
        p2p: Arc<P2p>,
    ) -> Ws {
        Ws {
            ip,
            port,
            p2p
        }
    }

    pub fn run(&self){
        let endpoint: String = self.ip.clone().add(":").add(self.port.to_string().as_ref());
        let server = WebSocket::new(|_| {
            move |_msg| {
                Ok(())
            }
        }).unwrap();
        let broadcast = server.broadcaster();
        let p2p = self.p2p.clone();
        let _ = thread::spawn(move||{
            loop {
                thread::sleep(Duration::from_secs(5));
                let mut active_nodes: Vec<Node> = vec![];
                for an in p2p.get_active_nodes() {
                    active_nodes.push(Node {
                        id: an.id,
                        revision: an.revision,
                        update: an.update,
                        ip: an.ip,
                        port: an.port,
                        block_number: an.block_number,
                        block_hash: an.block_hash,
                        total_difficulty: an.total_difficulty,
                    })
                }
                let json: String = to_string(&active_nodes).unwrap();
                let _ = broadcast.send(json);
            }
        });
        server.listen(endpoint).unwrap();
    }
}

