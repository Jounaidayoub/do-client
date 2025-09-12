# doTunnel

Expose your local server to the internet without configuring firewalls or port forwarding. `DoTunnel` creates a secure HTTP tunnel so you can share your localhost with the internet in seconds.

## Features

- HTTP tunneling 
- Zero firewall or port-forwarding setup  
- Single-command startup with `npx`
- Runs on Cloudflare Edge network for low latency (⚡ Blaazingly fast! lol)  

## Quick Start

### Run without installation

```bash
npx dotunnel
```

By default, this will:

1. Start a tunnel to your `localhost:3000`  
2. Output a public URL (e.g. `https://xyz123.do-tunnel.app`)  
3. Forward requests from the public URL to your local server  

### Install globally

```bash
npm install -g dotunnel
dotunnel
```

Use the `-g` or `--global` flag to install once and run via `dotunnel` instead of `npx`.

## Command-Line Options

```bash
dotunnel [options]
```

- `-p, --port <number>`  
    Specify the local port (default: 3000)

- `-h, --help`  
    Show help information

- `-v, --version`  
    Display the current version

## Examples

Expose port 8080 with one command:

```bash
npx dotunnel -p 8080
```

After running, you’ll see output like:

```
🚀 Tunnel established!
🔗 Public URL:  https://abc123.do-tunnel.app
🖥  Forwarding to localhost:8080
```

## Contributing

1. Fork the repository  
2. Create a feature branch (`git checkout -b feature-name`)  
3. Commit your changes (`git commit -m 'Add new feature'`)  
4. Push to the branch (`git push origin feature-name`)  
5. Open a Pull Request

## License

MIT © Your Name  