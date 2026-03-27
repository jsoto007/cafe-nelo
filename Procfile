web: cd server && flask --app wsgi db upgrade && exec gunicorn wsgi:app --bind 0.0.0.0:${PORT:-8000} --workers ${WEB_CONCURRENCY:-4} --timeout 120
assets: npm run build --prefix client
