use std::net::{TcpStream, TcpListener};
use std::io::{Read, Write};
use std::thread;

const RESPONSE: &[u8] =
    b"HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n\
    <html>\
        <head>\
            <title>monitor</title>\
        </head>\
        <body><div id=\"root\"></div></body>\
    </html>";

fn handle_read(mut stream: &TcpStream) {
    let mut buf = [0u8 ;4096];
    match stream.read(&mut buf) {
        Ok(_) => {
            let _req_str = String::from_utf8_lossy(&buf);
            // println!("{}", req_str);
        },
        Err(e) => println!("Unable to read stream: {}", e),
    }
}

fn handle_write(mut stream: TcpStream) {
    // let response = b"HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n<html><head></head><body>Hello world</body></html>\r\n";
    match stream.write(RESPONSE) {
        Ok(_) => {
            //println!("Response sent")
        },
        Err(e) => println!("Failed sending response: {}", e),
    }
}

fn handle_client(stream: TcpStream) {
    handle_read(&stream);
    handle_write(stream);
}

pub fn run() {
    let listener = TcpListener::bind("127.0.0.1:8080").unwrap();
    println!("<http ip=127.0.0.1 port={}>", 8080);
    for stream in listener.incoming() {
        match stream {
            Ok(stream) => {
                thread::spawn(|| {
                    handle_client(stream)
                });
            }
            Err(e) => {
                println!("Unable to connect: {}", e);
            }
        }
    }
}