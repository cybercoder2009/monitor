extern crate ws;
extern crate uuid;
extern crate p2p;
extern crate serde;
extern crate serde_json;
#[macro_use]
extern crate serde_derive;

pub mod api;
pub mod types;

use std::thread;
// use std::collections::HashMap;
// use std::sync::atomic::{AtomicBool,Ordering};
use std::sync::Arc;
use std::fs::File;
// use std::io::Read;
use uuid::Uuid;
use serde_json::Value;
use p2p::P2p;
use p2p::node::NodeInfo;
// use p2p::routes::REQ_HANDSHAKE;
// use p2p::routes::RES_HANDSHAKE;
// use p2p::routes::REQ_ACTIVE_NODES;
// use p2p::routes::RES_ACTIVE_NODES;
use p2p::routes::REQ_STATUS;
use p2p::routes::RES_STATUS;
use p2p::routes::REQ_HEADERS;
use p2p::routes::RES_HEADERS;
use p2p::routes::REQ_BODIES;
use p2p::routes::RES_BODIES;
use p2p::routes::BROADCAST_TX;
use p2p::routes::BROADCAST_BLOCK;
//use p2p::handlers::req_handshake;
// use p2p::handlers::res_handshake;
// use p2p::handlers::req_active_nodes;
// use p2p::handlers::res_active_nodes;
use p2p::sync::handlers::req_status;
use p2p::sync::handlers::res_status;
use p2p::sync::handlers::req_headers;
use p2p::sync::handlers::res_headers;
use p2p::sync::handlers::req_bodies;
use p2p::sync::handlers::res_bodies;
use p2p::sync::handlers::broadcast_block;
use p2p::sync::handlers::broadcast_tx;
use api::Ws;

fn main() {

//    let running = Arc::new(AtomicBool::new(true));
//    let r = running.clone();
//    ctrlc::set_handler(move || {
//        r.store(false, Ordering::SeqCst);
//    }).expect("Error setting Ctrl-C handler");

    //let chain = read_seeds("chain_mainnet.json");
    let chain = read_seeds("chain_mastery.json");
    //let chain = read_seeds("chain_custom.json");
    let my_uuid = Uuid::new_v4();
    let s = my_uuid.to_string();
    let mut node_id: [u8;36] = [0x00u8; 36];
    node_id[0 .. 36].copy_from_slice(&s.as_bytes()[0 .. 36]);
    let mut boot_nodes: Vec<NodeInfo> = Vec::new();
    let net_id: u32 = chain["net_id"].as_u64().unwrap() as u32;
    let nodes = chain["nodes"].as_array().unwrap();
    for node in nodes {
        boot_nodes.push(NodeInfo {
            if_seed: true,
            node_id: String::from(node["id"].as_str().unwrap()),
            ip: String::from(node["ip"].as_str().unwrap()),
            port: node["port"].as_u64().unwrap() as u16,
        });
    }

    let mut p2p = P2p::new(
        false,
        true,
        net_id,
        node_id,
        boot_nodes,
        5,
        100,
    );
    p2p.register(REQ_STATUS, req_status);
    p2p.register(RES_STATUS, res_status);
    p2p.register(REQ_HEADERS, req_headers);
    p2p.register(RES_HEADERS, res_headers);
    p2p.register(REQ_BODIES, req_bodies);
    p2p.register(RES_BODIES, res_bodies);
    p2p.register(BROADCAST_TX, broadcast_tx);
    p2p.register(BROADCAST_BLOCK, broadcast_block);
    p2p.run();

    let ws = Ws::new(String::from("127.0.0.1"),8888, Arc::new(p2p));
    ws.run();

    // shutdown hook
    let max: u64 = 100000;
    let mut count: u64 = 0;
    loop {
        thread::sleep(std::time::Duration::new(10, 0));
        count += 1;
        if count == max {
            break;
        }
    }
    println!("<core-shutdown>");
}

fn read_seeds(file: &str) -> Value{
    let file = File::open(file)
        .expect("file should open read only");
    let json: Value = serde_json::from_reader(file)
        .expect("file should be proper JSON");
    json
}