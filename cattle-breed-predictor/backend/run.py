#!/usr/bin/env python
"""
Convenience script to run the FastAPI app with uvicorn.

Usage:
    python run.py
    OR
    python run.py --reload --port 8000
"""

import uvicorn
import sys

if __name__ == "__main__":
    # Default args
    host = "0.0.0.0"
    port = 8000
    reload = True
    
    # Parse command line args if provided
    if "--port" in sys.argv:
        idx = sys.argv.index("--port")
        port = int(sys.argv[idx + 1])
    
    if "--no-reload" in sys.argv:
        reload = False
    
    # Run uvicorn
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info"
    )
