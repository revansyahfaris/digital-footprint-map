from fastapi import FastAPI

app = FastAPI()

@app.get("/api/status")
def read_status():
    return {"message": "Koneksi berhasil!"}