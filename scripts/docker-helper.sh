#!/bin/bash

##############################################################################
# Docker Compose Helper Script
#
# Usage: ./docker-helper.sh [build|up|down|logs|clean]
##############################################################################

set -euo pipefail

COMMAND=${1:-help}

case $COMMAND in
    build)
        echo "Building Docker images..."
        docker-compose build
        echo "Build completed successfully!"
        ;;
    
    up)
        echo "Starting all services..."
        docker-compose up -d
        echo -e "\nServices started. Waiting for health checks..."
        sleep 5
        docker-compose ps
        echo -e "\n✓ All services are running"
        echo "Frontend: http://localhost:3000"
        echo "API: http://localhost:8088"
        echo "Docs: http://localhost:8088/api/docs"
        ;;
    
    down)
        echo "Stopping all services..."
        docker-compose down
        echo "✓ Services stopped"
        ;;
    
    logs)
        SERVICE=${2:-core-notification-service}
        echo "Showing logs for ${SERVICE}..."
        docker-compose logs -f "$SERVICE"
        ;;
    
    clean)
        echo "Removing all containers and volumes..."
        docker-compose down -v
        echo "✓ Cleaned up"
        ;;
    
    rebuild)
        echo "Rebuilding without cache..."
        docker-compose build --no-cache
        docker-compose up -d
        echo "✓ Rebuilt and restarted"
        ;;
    
    status)
        docker-compose ps
        ;;
    
    logs-all)
        docker-compose logs --tail=50
        ;;
    
    shell)
        SERVICE=${2:-core-notification-service}
        echo "Connecting to ${SERVICE}..."
        docker-compose exec "$SERVICE" sh
        ;;
    
    *)
        echo "Usage: $0 {up|down|build|rebuild|logs|logs-all|clean|status|shell} [service]"
        echo ""
        echo "Commands:"
        echo "  up          - Start all services"
        echo "  down        - Stop all services"
        echo "  build       - Build Docker images"
        echo "  rebuild     - Rebuild without cache and restart"
        echo "  logs        - Show logs for service (default: core-notification-service)"
        echo "  logs-all    - Show logs for all services"
        echo "  clean       - Remove containers and volumes"
        echo "  status      - Show service status"
        echo "  shell       - Open shell in service"
        echo ""
        echo "Examples:"
        echo "  $0 up"
        echo "  $0 logs postgres"
        echo "  $0 shell postgres"
        exit 1
        ;;
esac

exit 0
