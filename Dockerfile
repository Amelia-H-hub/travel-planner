# 使用 AWS 官方提供的 Python 3.12 Lambda 基礎鏡像
FROM public.ecr.aws/lambda/python:3.12

# 設定工作目錄
WORKDIR ${LAMBDA_TASK_ROOT}

# 安裝 Python 套件前，先安裝編譯工具和必要的函式庫
# - gcc: C 編譯器，用於安裝 numpy, pandas, bcrypt 等。
# - python3-devel: 包含 Python 3 的頭文件，供原生套件編譯時使用。
# - postgresql-devel: 提供 libpq 相關的開發文件和函式庫，用於安裝 psycopg2。
RUN microdnf update -y && \
    microdnf install -y gcc python3-devel postgresql-devel && \
    microdnf clean all

# 複製需求檔案並安裝相依套件
COPY requirements.txt .
RUN pip install -r requirements.txt --no-cache-dir --compile

# 複製 Lambda 函式程式碼到工作目錄
COPY backend/ ./backend/

# 設定 Lambda 處理程序 (Handler)
# FastAPI 實例叫做 'app' 且在 'backend/main.py' 中
CMD [ "backend.main.handler" ]