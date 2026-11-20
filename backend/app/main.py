from fastapi import FastAPI

app = FastAPI(title="Internship Intelligence API")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
