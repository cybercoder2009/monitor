#[derive(Serialize)]
pub struct Node{
    pub id: String,
    pub revision: String,
    pub update: u64,

    pub ip: String,
    pub port: u16,

    pub block_number: u64,
    pub block_hash: String,
    pub total_difficulty: u64,
}