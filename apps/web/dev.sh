# Load environment variables and run dev server
export $(cat .env | grep -v '^#' | xargs) && npm run dev
