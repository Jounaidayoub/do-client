# doTunnel

Expose your local server to the internet without configuring firewalls or port forwarding. [Dotunnel](https://github.com/jounaidayoub/do) creates a secure HTTP tunnel so you can share your localhost with the internet in seconds. 

Wanna test a webhook ? quick share/demo for webapp , API , Test on mobile ? or sharing anything running on your localhost ? Dotunnel is here for u , easy and fast .

[![npm version](https://badge.fury.io/js/dotunnel.svg)](https://badge.fury.io/js/dotunnel) 
![NPM Downloads](https://img.shields.io/npm/d18m/dotunnel)



## Features

- HTTP tunneling
- Zero firewall or port-forwarding setup
- Single-command startup with `npx dotunnel`
- Runs on Cloudflare Edge network for low latency (⚡ Blazingly fast!)

## Quick Start

### Run without installation

```bash
npx dotunnel
```

By default, this will:

1. Prompt you for your local port (e.g.: 3000)
2. Ask for a name for your proxy (e.g.: `my-app`)
3. Output a public URL (e.g. `https://my-app-prxy.ayooub.me`)
4. ✅ Forward requests from the public URL to your local server

### Example Usage

When you run `npx dotunnel`, you’ll see:

```bash
$ npx dotunnel


? Enter the local port of the service to expose (e.g., 8000): 3000
? Enter a name for the proxy (e.g., todo): todo-api


🌐 Forwarding to: http://localhost:3000
🔗 Public URL:    https://todo-api-prxy.ayooub.me
```

Currently, all options are configured via an interactive prompt. Flags (e.g. `-p`, `--port`) will be supported Soon !!.

### Install globally

```bash
npm install -g dotunnel
dotunnel
```

Use the `-g` or `--global` flag to install once and run via `dotunnel` instead of `npx`.

## Contributing

1. Fork this  [repository](https://github.com/jounaidayoub/dotunnel-client)
2. Create a feature branch (`git checkout -b feature-name`)
3. Commit your changes (`git commit -m "Add new feature"`)
4. Push to the branch (`git push origin feature-name`)
5. Open a Pull Request

