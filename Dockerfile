# ClawSkill Dockerfile
# Multi-stage build for minimal production image

# ============================================
# Stage 1: Build
# ============================================
FROM golang:1.22-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git ca-certificates tzdata

WORKDIR /build

# Copy go mod files first for better caching
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the binary
# CGO_ENABLED=0 for static binary
# -ldflags for minimal binary size
RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-w -s -X main.version=$(git describe --tags --always --dirty 2>/dev/null || echo 'dev')" \
    -o /build/clawskill \
    ./cmd/server

# ============================================
# Stage 2: Runtime
# ============================================
FROM alpine:3.19 AS runtime

# Install runtime dependencies
RUN apk add --no-cache ca-certificates tzdata

# Create non-root user for security
RUN addgroup -g 1000 clawskill && \
    adduser -u 1000 -G clawskill -s /bin/sh -D clawskill

WORKDIR /app

# Copy binary from builder
COPY --from=builder /build/clawskill /app/clawskill

# Copy any static assets if needed
# COPY --from=builder /build/static /app/static

# Set ownership
RUN chown -R clawskill:clawskill /app

# Switch to non-root user
USER clawskill

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Run the binary
ENTRYPOINT ["/app/clawskill"]
CMD ["serve"]

# ============================================
# Stage 3: Development
# ============================================
FROM golang:1.22-alpine AS development

RUN apk add --no-cache git ca-certificates tzdata

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Install air for hot reload
RUN go install github.com/cosmtrek/air@latest

# Expose port
EXPOSE 8080

# Run with hot reload
CMD ["air", "-c", ".air.toml"]