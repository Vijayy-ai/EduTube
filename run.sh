#!/bin/bash
cd backend && PYTHONPATH=$PYTHONPATH:$(pwd) gunicorn --bind=0.0.0.0:$PORT edutube.wsgi:application 