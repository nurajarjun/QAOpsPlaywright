# IT / Network Team — Infrastructure Setup Request
## Playwright Test Automation — Internal Application Access

**Raised by:** QA / Automation Team  
**Priority:** Medium  
**Date:** 2026-06-13  

---

## 1. Background

We are setting up an automated testing framework using **Playwright** (a browser-based test automation tool) to run end-to-end tests against our internal web application.

Tests run inside a **Docker container** on either:
- A developer's machine on the office LAN, or
- A CI/CD server (self-hosted GitHub Actions runner) on the office LAN

The container launches a headless Chromium browser that needs to reach our internal application over the network — exactly like a user opening a browser and visiting the app.

---

## 2. What We Need

### 2.1 Firewall Rules

Please allow outbound traffic from the CI/CD server (or developer machines running Docker) to the internal application server.

| Rule # | Source | Destination | Port | Protocol | Purpose |
|--------|--------|-------------|------|----------|---------|
| 1 | CI Server IP _(see Section 5)_ | App Server IP _(see Section 5)_ | 443 | TCP/HTTPS | Test browser → internal app (HTTPS) |
| 2 | CI Server IP | App Server IP | 80 | TCP/HTTP | Fallback HTTP (if app serves on 80) |
| 3 | CI Server IP | Corporate DNS IP | 53 | UDP/TCP | DNS name resolution |

> **Note:** If the application is only accessible via HTTPS, Rule 2 is optional.

---

### 2.2 DNS Resolution

The test framework needs to resolve internal hostnames (e.g., `myapp.corp.local`) from inside the Docker container and the CI server.

**Request:**  
- Confirm the IP address of the corporate DNS server
- Ensure the CI server is configured to use corporate DNS
- Confirm that the internal application's hostname resolves correctly from the CI server

**To verify after setup — run this on the CI server:**
```bash
nslookup myapp.corp.local <corporate-dns-ip>
```
Expected result: returns the app server's internal IP.

---

### 2.3 SSL / TLS Certificate

If the internal application uses a **self-signed certificate** or a certificate issued by an **internal Certificate Authority (CA)**:

**Request:**  
- Provide the root CA certificate file (`.crt` or `.pem` format)
- We will install it inside the Docker image so the browser trusts the app's certificate

**Why this matters:** Chromium (used by Playwright) will refuse to connect to sites with untrusted certificates, causing all tests to fail with an SSL error.

---

### 2.4 IP Whitelisting (if applicable)

If the internal application has an **IP allowlist** (only specific IPs can access it):

**Request:**  
- Add the CI server's IP address to the allowlist
- If developer machines also run tests locally, add the IP range of developer workstations

---

### 2.5 Self-Hosted GitHub Actions Runner (CI Server)

We need a machine inside the office network to act as our CI/CD runner. This machine will:
- Receive test job triggers from GitHub
- Run Docker containers with Playwright tests
- Report results back to GitHub

**Request:**  
- Provision a Linux server (Ubuntu 22.04 preferred) **on the office LAN** with:
  - Outbound internet access to `github.com` on port 443 (to receive CI jobs)
  - Inbound LAN access to the internal application (covered by firewall rules above)
  - Docker installed (or permission for us to install it)
  - Minimum spec: 2 CPU cores, 4 GB RAM, 20 GB disk

> **Why not cloud CI?** GitHub's hosted runners (`ubuntu-latest`) run in Microsoft Azure data centers — they have no access to our internal network. A self-hosted runner on the office LAN solves this.

---

## 3. Architecture Diagram

```
                        OFFICE NETWORK
  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │   ┌──────────────────┐          ┌────────────────────┐  │
  │   │  CI/CD Server    │  Port    │  Internal App      │  │
  │   │  (self-hosted    │──443────▶│  Server            │  │
  │   │   runner)        │          │  myapp.corp.local  │  │
  │   │                  │          └────────────────────┘  │
  │   │  ┌────────────┐  │                                  │
  │   │  │  Docker    │  │          ┌────────────────────┐  │
  │   │  │  Container │  │──DNS────▶│  Corporate DNS     │  │
  │   │  │  Playwright│  │  Port 53 │  192.168.1.10      │  │
  │   │  └────────────┘  │          └────────────────────┘  │
  │   └──────────────────┘                                  │
  │            │                                            │
  └────────────┼────────────────────────────────────────────┘
               │ Port 443 (outbound only)
               ▼
         github.com
         (receive CI job triggers, report results)
```

---

## 4. Security Notes

- The Docker container only makes **outbound** requests — it does not expose any ports or accept inbound connections
- Tests run as a **non-root user** inside the container
- No credentials are stored in the Docker image — they are passed via environment variables at runtime
- The CI server does **not** need inbound access from the internet (GitHub runner polling is outbound)
- Test reports are stored locally on the CI server — no data leaves the network except CI job status to GitHub

---

## 5. Details to Fill In

Please complete this section before submitting the ticket:

| Field | Value |
|-------|-------|
| CI Server hostname | _(to be assigned by IT)_ |
| CI Server IP | _(to be assigned by IT)_ |
| Internal app hostname | e.g. `myapp.corp.local` |
| Internal app server IP | _(provided by app team)_ |
| Corporate DNS server IP | _(provided by IT)_ |
| Internal CA certificate | _(provided by IT if applicable)_ |
| App port (HTTP) | 80 |
| App port (HTTPS) | 443 |

---

## 6. Verification Steps

Once the setup is complete, the QA team will verify using the following checklist:

- [ ] CI server can resolve internal app hostname via corporate DNS
- [ ] CI server can reach app server on port 443 (`curl -I https://myapp.corp.local`)
- [ ] Docker container can resolve and reach app server (`docker run --rm curlimages/curl https://myapp.corp.local`)
- [ ] SSL certificate is trusted (no certificate errors in curl output)
- [ ] Playwright test run completes successfully from CI server
- [ ] GitHub Actions job triggers and reports pass/fail status on GitHub

---

## 7. Contact

| Role | Name | Contact |
|------|------|---------|
| QA Lead / Requester | _(your name)_ | _(your email)_ |
| App Server Owner | _(app team contact)_ | _(email)_ |
| GitHub Org Admin | _(DevOps contact)_ | _(email)_ |

---

## 8. References

- [Playwright Docker documentation](https://playwright.dev/docs/docker)
- [GitHub self-hosted runner documentation](https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/about-self-hosted-runners)
- Internal app URL: _(fill in)_
- CI repository: `https://github.com/nurajarjun/QAOpsPlaywright`
