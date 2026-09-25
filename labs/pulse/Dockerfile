FROM python:3.12-slim-bookworm

RUN useradd --create-home --uid 10001 appuser
WORKDIR /app
COPY app.py /app/app.py
RUN mkdir -p /data && chown appuser:appuser /data
USER appuser
EXPOSE 8080
ENV PULSE_DATA_DIR=/data
CMD ["python", "-u", "/app/app.py"]
