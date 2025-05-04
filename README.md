​![tag : innovationlab](https://img.shields.io/badge/innovationlab-3D8BD3)

# Memgen MCP Server

A Model Context Protocol server that generates memes from user input using OpenAI's image editing capabilities.

## Overview

This server implements the Model Context Protocol (MCP) to provide meme generation functionality. It takes a text description as input, refines it using AI, and generates a meme image by editing a base template. The generated images are uploaded to MinIO S3-compatible storage and returned as URLs.

## Features

- MCP-compliant server for seamless integration with MCP clients
- Prompt refinement using AI to optimize meme descriptions
- Image generation using OpenAI's GPT-image-1 model
- Automatic upload of generated images to MinIO S3 storage

## Prerequisites

- Node.js >= 22.0.0
- MinIO S3-compatible storage
- OpenAI API key

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/sint-ai/image_mcp_server.git
   cd image_mcp_server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the example environment file and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` with your configuration:
   - `PORT`: Server port
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `MINIO_ENDPOINT`: MinIO server endpoint
   - `MINIO_PORT`: MinIO server port
   - `MINIO_USE_SSL`: Whether to use SSL for MinIO connection
   - `MINIO_ACCESS_KEY`: MinIO access key
   - `MINIO_SECRET_KEY`: MinIO secret key
   - `MINIO_BUCKET_NAME`: MinIO bucket name
   - `MINIO_BUCKET_URL`: Public URL for accessing the MinIO bucket

## Usage

Start the server:

```bash
npm start
```

The server will start running on the configured port (default: 3000).

### API Endpoints

- `POST /mcp`: Main MCP endpoint for processing requests

### MCP Tooling

This server provides the following MCP tool:

- `create_meme`: Generates a meme from a text description
  - Input: String describing the desired meme
  - Output: URLs to the generated images

## Development

Check TypeScript types:

```bash
npm run check-types
```
