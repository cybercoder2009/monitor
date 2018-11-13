extern crate p2p;
extern crate uuid;

use std::thread;
use std::collections::HashMap;
use uuid::Uuid;
use p2p::P2p;
use p2p::node::NodeInfo;
use p2p::routes::REQ_HANDSHAKE;
use p2p::routes::RES_HANDSHAKE;
use p2p::routes::REQ_ACTIVE_NODES;
use p2p::routes::RES_ACTIVE_NODES;
use p2p::routes::REQ_STATUS;
use p2p::routes::RES_STATUS;
use p2p::routes::REQ_HEADERS;
use p2p::routes::RES_HEADERS;
use p2p::routes::REQ_BODIES;
use p2p::routes::RES_BODIES;
use p2p::routes::BROADCAST_TX;
use p2p::routes::BROADCAST_BLOCK;
use p2p::handlers::req_handshake;
use p2p::handlers::res_handshake;
use p2p::handlers::req_active_nodes;
use p2p::handlers::res_active_nodes;
use p2p::sync::handlers::req_status;
use p2p::sync::handlers::res_status;
use p2p::sync::handlers::req_headers;
use p2p::sync::handlers::res_headers;
use p2p::sync::handlers::req_bodies;
use p2p::sync::handlers::res_bodies;
use p2p::sync::handlers::broadcast_block;
use p2p::sync::handlers::broadcast_tx;

fn main() {

    let my_uuid = Uuid::new_v4();
    let s = my_uuid.to_string();
    let mut node_id: [u8;36] = [0x00u8; 36];
    node_id[0 .. 36].copy_from_slice(&s.as_bytes()[0 .. 36]);

    let mut boot_nodes: Vec<NodeInfo> = Vec::new();

    // aion main net seed
//    boot_nodes.push(NodeInfo {
//        if_seed: true,
//        node_id: String::from("c33d1066-8c7e-496c-9c4e-c89318280274"),
//        ip: String::from("13.92.155.115"),
//        port: 30303,
//    });
//    boot_nodes.push(NodeInfo {
//        if_seed: true,
//        node_id: String::from("c88d1066-8c7e-496c-9c4e-c89318280274"),
//        ip: String::from("127.0.0.1"),
//        port: 30303,
//    });
//    aion
    boot_nodes.push(NodeInfo {
        if_seed: true,
        node_id: String::from("c33d1066-8c7e-496c-9c4e-c89318280274"),
        ip: String::from("66.207.217.190"),
        port: 30303,
    });

    let mut p2p = P2p::new(
        false,
        true,
        256,
        node_id,
        boot_nodes,
        5,
        10,
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
    // http::run();
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