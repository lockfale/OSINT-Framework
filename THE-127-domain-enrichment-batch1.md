# THE-127: Domain Name Tools Enrichment - Batch 1

Enrichment data for 25 Domain Name tools in the OSINT Framework arf.json.

## Whois Records Category

### 1. Domain Dossier
```json
{
  "description": "Free web-based tool that aggregates WHOIS, DNS, and network information for domains and IP addresses into a single consolidated report.",
  "status": "live",
  "pricing": "free",
  "bestFor": "Quick domain and IP reconnaissance with DNS and WHOIS data",
  "input": "Domain name or IP address",
  "output": "WHOIS records, DNS records, IP information, registration details",
  "opsec": "passive",
  "opsecNote": "Queries public WHOIS and DNS records; does not contact the target domain directly.",
  "localInstall": false,
  "googleDork": false,
  "registration": false,
  "editUrl": false,
  "api": false,
  "invitationOnly": false,
  "deprecated": false
}
```

### 2. domainIQ
```json
{
  "description": "Comprehensive domain intelligence platform offering reverse lookups, ownership history, and related domain discovery. Trusted by government agencies, domain investors, and legal firms.",
  "status": "live",
  "pricing": "freemium",
  "bestFor": "Domain ownership history, reverse analytics lookup, competitor domain research",
  "input": "Domain name",
  "output": "Domain owner information, historical ownership, similar domains, analytics data, reverse MX/IP/DNS lookups",
  "opsec": "passive",
  "opsecNote": "Queries aggregated domain data; does not probe the target directly.",
  "localInstall": false,
  "googleDork": false,
  "registration": true,
  "editUrl": false,
  "api": false,
  "invitationOnly": false,
  "deprecated": false
}
```

### 3. DomainTools Whois
```json
{
  "description": "Enterprise-grade WHOIS API with decades of historical domain data and rapid query response. The industry leader for threat intelligence and domain tracking.",
  "status": "live",
  "pricing": "paid",
  "bestFor": "Historical WHOIS research, threat actor tracking, enterprise domain intelligence",
  "input": "Domain name or IP address",
  "output": "Current and historical WHOIS records, registrant details, hosting history",
  "opsec": "passive",
  "opsecNote": "Queries cached WHOIS data; no direct contact with target infrastructure.",
  "localInstall": false,
  "googleDork": false,
  "registration": true,
  "editUrl": false,
  "api": true,
  "invitationOnly": false,
  "deprecated": false
}
```

### 4. SWITCH Internet Domains Whois (.ch)
```json
{
  "description": "Official Swiss domain registry WHOIS lookup service operated by SWITCH for .ch and .li country-code domains. Public registry with all owner contact details visible.",
  "status": "live",
  "pricing": "free",
  "bestFor": ".ch and .li domain ownership research, Swiss Internet infrastructure lookup",
  "input": ".ch or .li domain name",
  "output": "Registrant contact details, creation/expiry dates, nameservers, registration status",
  "opsec": "passive",
  "opsecNote": "Queries the official SWITCH registry database; does not probe the target.",
  "localInstall": false,
  "googleDork": false,
  "registration": false,
  "editUrl": false,
  "api": false,
  "invitationOnly": false,
  "deprecated": false
}
```

### 5. Whoisology
```json
{
  "description": "Searchable archive of billions of current and historical domain WHOIS records with cross-referencing capabilities. Designed for InfoSec, legal, and research professionals.",
  "status": "live",
  "pricing": "freemium",
  "bestFor": "Historical domain ownership, reverse WHOIS lookups, domain connection tracking",
  "input": "Domain name, email, registrant name",
  "output": "Historical WHOIS records, ownership changes, registrant information across domains",
  "opsec": "passive",
  "opsecNote": "Accesses archived WHOIS data; no direct probing of target domains.",
  "localInstall": false,
  "googleDork": false,
  "registration": false,
  "editUrl": false,
  "api": false,
  "invitationOnly": false,
  "deprecated": false
}
```

### 6. Whois ARIN
```json
{
  "description": "Official American Registry for Internet Numbers WHOIS and RDAP lookup service for IPv4, IPv6, ASNs, and organizations in the North American region.",
  "status": "live",
  "pricing": "free",
  "bestFor": "IP address and ASN registration data, North American internet resource tracking",
  "input": "IP address, ASN, organization name, contact information",
  "output": "IP ownership, organization details, Points of Contact (POCs), ASN information",
  "opsec": "passive",
  "opsecNote": "Queries official ARIN database; does not contact targets or perform active scanning.",
  "localInstall": false,
  "googleDork": false,
  "registration": false,
  "editUrl": false,
  "api": false,
  "invitationOnly": false,
  "deprecated": false
}
```

### 7. DNSstuff
```json
{
  "description": "Suite of free DNS and network tools providing lookups, DNS checks, and WHOIS information for domain reconnaissance.",
  "status": "live",
  "pricing": "free",
  "bestFor": "Quick DNS and WHOIS lookups, network diagnostics",
  "input": "Domain name, IP address",
  "output": "DNS records, WHOIS data, DNS propagation checks, nameserver information",
  "opsec": "passive",
  "opsecNote": "Queries public DNS and WHOIS servers; does not probe target infrastructure.",
  "localInstall": false,
  "googleDork": false,
  "registration": false,
  "editUrl": false,
  "api": false,
  "invitationOnly": false,
  "deprecated": false
}
```

### 8. Robtex
```json
{
  "description": "Comprehensive free DNS lookup and network intelligence tool with decade-spanning database containing billions of documents of internet data. Useful for forensics and threat actor tracking.",
  "status": "live",
  "pricing": "free",
  "bestFor": "DNS reconnaissance, IP and domain relationship mapping, historical internet data lookup",
  "input": "Domain name, IP address, hostname, autonomous system",
  "output": "DNS records, IP information, SEO data, reputation scores, historical relationships",
  "opsec": "passive",
  "opsecNote": "Searches historical and cached DNS data; does not perform active probing.",
  "localInstall": false,
  "googleDork": false,
  "registration": false,
  "editUrl": false,
  "api": false,
  "invitationOnly": false,
  "deprecated": false
}
```

### 9. Domaincrawler.com
```json
{
  "description": "Enterprise-grade domain database covering 1.4+ billion registered and unregistered domains with 80+ billion historical records since 2008. Used by brand protection and OSINT professionals.",
  "status": "live",
  "pricing": "paid",
  "bestFor": "Large-scale domain research, brand protection monitoring, zone file analysis, market intelligence",
  "input": "Domain name, DNS data, technology stack filters",
  "output": "Domain metadata, DNS configuration, SSL certificates, technology stack, ownership connections, historical data",
  "opsec": "passive",
  "opsecNote": "Queries aggregated domain database updated every 7 days; no active scanning of targets.",
  "localInstall": false,
  "googleDork": false,
  "registration": true,
  "editUrl": false,
  "api": true,
  "invitationOnly": false,
  "deprecated": false
}
```

### 10. MarkMonitor Whois Search
```json
{
  "description": "ICANN-accredited registrar and brand protection company offering WHOIS lookup and domain management services. Exclusively serves corporate clients including major global brands.",
  "status": "live",
  "pricing": "paid",
  "bestFor": "Corporate domain portfolio management, brand protection, trademark monitoring",
  "input": "Domain name",
  "output": "WHOIS records, registration data, brand portfolio information",
  "opsec": "passive",
  "opsecNote": "Accesses standard WHOIS records through registered domain lookups; no direct target probing.",
  "localInstall": false,
  "googleDork": false,
  "registration": true,
  "editUrl": false,
  "api": false,
  "invitationOnly": false,
  "deprecated": false
}
```

### 11. easyWhois
```json
{
  "description": "Free domain WHOIS lookup and DNS tools service. Now operated under the DomainHelp platform, providing domain registration information and DNS lookups.",
  "status": "live",
  "pricing": "free",
  "bestFor": "Quick domain WHOIS lookups and DNS checks",
  "input": "Domain name",
  "output": "WHOIS records, DNS information, registrant details, nameservers",
  "opsec": "passive",
  "opsecNote": "Queries public WHOIS and DNS data; does not contact the target domain.",
  "localInstall": false,
  "googleDork": false,
  "registration": false,
  "editUrl": false,
  "api": false,
  "invitationOnly": false,
  "deprecated": false
}
```

### 12. Website Informer
```json
{
  "description": "Free domain and website information aggregator providing visitor statistics, safety status, Alexa rankings, ownership data, and technical details about websites.",
  "status": "live",
  "pricing": "free",
  "bestFor": "Website profiling, ownership verification, traffic estimation, technical stack discovery",
  "input": "Domain name or URL",
  "output": "Visitor statistics, safety ratings, domain owner information, technology stack, Alexa rank, historical snapshots",
  "opsec": "passive",
  "opsecNote": "Aggregates public website data and statistics; does not contact the target infrastructure.",
  "localInstall": false,
  "googleDork": false,
  "registration": false,
  "editUrl": false,
  "api": false,
  "invitationOnly": false,
  "deprecated": false
}
```

### 13. Who.is
```json
{
  "description": "Comprehensive WHOIS and RDAP lookup service with large database of domain registration, DNS records, and IP information. Provides both current and historical data.",
  "status": "live",
  "pricing": "free",
  "bestFor": "Domain registration research, WHOIS lookups, RDAP queries, IP tracking",
  "input": "Domain name or IP address",
  "output": "WHOIS records, RDAP data, DNS records, nameservers, registrant information",
  "opsec": "passive",
  "opsecNote": "Queries public WHOIS and RDAP databases; does not perform active scanning.",
  "localInstall": false,
  "googleDork": false,
  "registration": false,
  "editUrl": false,
  "api": false,
  "invitationOnly": false,
  "deprecated": false
}
```

### 14. Whois AMPed
```json
{
  "description": "Mobile-optimized WHOIS lookup service accessible via web interface for domain registration information and WHOIS queries.",
  "status": "live",
  "pricing": "free",
  "bestFor": "Mobile-friendly WHOIS lookups, quick domain information retrieval",
  "input": "Domain name",
  "output": "WHOIS records, domain registration information, registrant details",
  "opsec": "passive",
  "opsecNote": "Accesses public WHOIS data; no target probing or direct contact.",
  "localInstall": false,
  "googleDork": false,
  "registration": false,
  "editUrl": false,
  "api": false,
  "invitationOnly": false,
  "deprecated": false
}
```

### 15. ViewDNS.info
```json
{
  "description": "Comprehensive DNS lookup and WHOIS service providing detailed DNS records, reverse IP lookups, reverse WHOIS searches, and API access for automated queries.",
  "status": "live",
  "pricing": "free",
  "bestFor": "DNS reconnaissance, reverse IP and reverse WHOIS lookups, historical DNS tracking",
  "input": "Domain name, IP address, registrant name/email, nameserver",
  "output": "DNS records, WHOIS information, reverse lookups, IP hosting, historical DNS changes",
  "opsec": "passive",
  "opsecNote": "Queries public DNS and WHOIS data; does not perform active probing of targets.",
  "localInstall": false,
  "googleDork": false,
  "registration": false,
  "editUrl": false,
  "api": true,
  "invitationOnly": false,
  "deprecated": false
}
```

### 16. Daily DNS Changes
```json
{
  "description": "DomainTools service monitoring DNS record changes across domains, detecting newly registered subdomains and tracking DNS infrastructure modifications.",
  "status": "live",
  "pricing": "freemium",
  "bestFor": "DNS change detection, subdomain discovery, infrastructure monitoring",
  "input": "Domain name",
  "output": "New DNS records, nameserver changes, subdomain discoveries, historical DNS changes",
  "opsec": "passive",
  "opsecNote": "Monitors public DNS records for changes; no active scanning or direct contact.",
  "localInstall": false,
  "googleDork": false,
  "registration": false,
  "editUrl": false,
  "api": false,
  "invitationOnly": false,
  "deprecated": false
}
```

### 17. IP2WHOIS
```json
{
  "description": "Free WHOIS lookup service for domain names and IP addresses, providing registration details, registrant information, location data, and API access.",
  "status": "live",
  "pricing": "free",
  "bestFor": "Domain and IP WHOIS lookups, registrant research",
  "input": "Domain name or IP address",
  "output": "WHOIS records, registrant details, location information, registration dates",
  "opsec": "passive",
  "opsecNote": "Queries public WHOIS databases; does not contact the target.",
  "localInstall": false,
  "googleDork": false,
  "registration": false,
  "editUrl": false,
  "api": true,
  "invitationOnly": false,
  "deprecated": false
}
```

### 18. Netlas.io
```json
{
  "description": "Comprehensive internet-wide scanning and OSINT platform providing DNS, WHOIS, SSL, and network reconnaissance with attack surface discovery capabilities.",
  "status": "live",
  "pricing": "freemium",
  "bestFor": "Internet reconnaissance, DNS and WHOIS lookups, attack surface discovery, vulnerability research",
  "input": "Domain name, IP address, ASN, DNS records",
  "output": "DNS records, WHOIS data, open ports, SSL certificates, service information, historical data",
  "opsec": "passive",
  "opsecNote": "Queries cached internet scanning data; free tier available with 50 daily requests.",
  "localInstall": false,
  "googleDork": false,
  "registration": false,
  "editUrl": false,
  "api": true,
  "invitationOnly": false,
  "deprecated": false
}
```

## Subdomains Category

### 19. SynapsInt
```json
{
  "description": "Unified web-based OSINT research platform supporting domain, IP, SSL, analytics, email, phone, and social media lookups with subdomain enumeration.",
  "status": "live",
  "pricing": "free",
  "bestFor": "Unified OSINT research, subdomain discovery, multi-vector intelligence gathering",
  "input": "Domain, IP, email, phone, username, CVE ID",
  "output": "Subdomains, DNS records, WHOIS data, open ports, vulnerabilities, social media accounts, historical data",
  "opsec": "passive",
  "opsecNote": "Aggregates publicly available information from multiple sources; no direct target contact.",
  "localInstall": false,
  "googleDork": false,
  "registration": false,
  "editUrl": false,
  "api": false,
  "invitationOnly": false,
  "deprecated": false
}
```

### 20. Aquatone
```json
{
  "description": "Go-based tool for domain reconnaissance that automates subdomain discovery, HTTP service scanning, screenshot capture, and visual HTML report generation for attack surface analysis.",
  "status": "live",
  "pricing": "free",
  "bestFor": "Visual subdomain reconnaissance, HTTP service discovery, attack surface mapping",
  "input": "Domain name",
  "output": "Discovered subdomains, open ports, HTTP screenshots, consolidated reconnaissance report",
  "opsec": "active",
  "opsecNote": "Makes HTTP requests to discovered hosts to capture screenshots and fingerprint services; supports integration with passive enumeration tools.",
  "localInstall": true,
  "googleDork": false,
  "registration": false,
  "editUrl": false,
  "api": false,
  "invitationOnly": false,
  "deprecated": false
}
```

### 21. FindSubDomains
```json
{
  "description": "Free web-based automated subdomain discovery tool with filtering and analysis capabilities, showing organization names, relationships, and top subdomain statistics.",
  "status": "live",
  "pricing": "free",
  "bestFor": "Automated subdomain enumeration, organization name filtering, subdomain statistics",
  "input": "Domain name or keyword",
  "output": "Discovered subdomains, organization associations, popularity metrics, filtering options",
  "opsec": "passive",
  "opsecNote": "Uses passive DNS and search-based methods for subdomain discovery; no active probing.",
  "localInstall": false,
  "googleDork": false,
  "registration": false,
  "editUrl": false,
  "api": false,
  "invitationOnly": false,
  "deprecated": false
}
```

### 22. Google Subdomains
```json
{
  "description": "Google Dork technique using the 'site:' operator to enumerate subdomains of a target domain via Google's search index.",
  "status": "live",
  "pricing": "free",
  "bestFor": "Indexed subdomain discovery, publicly visible subdomain enumeration",
  "input": "Domain name (as Google Dork syntax: site:domain.com)",
  "output": "Indexed subdomains and pages from Google search results",
  "opsec": "passive",
  "opsecNote": "Uses Google's search index; no direct contact with the target domain.",
  "localInstall": false,
  "googleDork": true,
  "registration": false,
  "editUrl": true,
  "api": false,
  "invitationOnly": false,
  "deprecated": false
}
```

### 23. Recon-ng
```json
{
  "description": "Full-featured web reconnaissance framework with independent modules for data gathering, API integration, and customizable workflows.",
  "status": "live",
  "pricing": "free",
  "bestFor": "Modular web recon, API-driven data collection, credential gathering",
  "input": "Domain, company name, email, IP",
  "output": "Contacts, hosts, credentials, ports via module-specific results",
  "opsec": "passive",
  "opsecNote": "Queries third-party APIs and data sources. Does not probe the target unless specific modules are configured to do so.",
  "localInstall": true,
  "googleDork": false,
  "registration": false,
  "editUrl": false,
  "api": true,
  "invitationOnly": false,
  "deprecated": false
}
```

### 24. XRay
```json
{
  "description": "Go-based network reconnaissance tool that automates subdomain enumeration via DNS brute force, integrates Shodan for port discovery, and gathers banner information with web UI visualization.",
  "status": "live",
  "pricing": "free",
  "bestFor": "Automated subdomain discovery with banner grabbing, open port enumeration, Shodan integration",
  "input": "Domain name, subdomain wordlist, Shodan API key (optional), ViewDNS API key (optional)",
  "output": "Enumerated subdomains, open ports, banner information, historical data, web-based results UI",
  "opsec": "active",
  "opsecNote": "Performs DNS brute force for subdomain enumeration and makes banner grabbing connections to discovered services.",
  "localInstall": true,
  "googleDork": false,
  "registration": false,
  "editUrl": false,
  "api": false,
  "invitationOnly": false,
  "deprecated": false
}
```

### 25. DNS Recon
```json
{
  "description": "Python-based DNS enumeration script supporting zone transfers, standard record enumeration, TLD expansion, DNS brute force, and PTR lookups.",
  "status": "live",
  "pricing": "free",
  "bestFor": "DNS enumeration, zone transfer testing, subdomain brute forcing, DNS security assessment",
  "input": "Domain name, IP range/CIDR, subdomain wordlist, DNS server address",
  "output": "NS/SOA/MX/A records, discovered subdomains, zone transfer results, PTR records, wildcard resolution status",
  "opsec": "active",
  "opsecNote": "Performs active DNS queries and brute force attempts; does not probe target services directly but makes repeated DNS requests.",
  "localInstall": true,
  "googleDork": false,
  "registration": false,
  "editUrl": false,
  "api": false,
  "invitationOnly": false,
  "deprecated": false
}
```

---

## Summary

**Tools researched**: 25
**Category**: Domain Name (Whois Records: 18, Subdomains: 7)
**Pricing breakdown**:
- Free: 15 tools
- Freemium: 4 tools
- Paid: 6 tools

**OPSEC profile**:
- Passive: 19 tools
- Active: 6 tools

**Local installation required**: 5 tools (Aquatone, Recon-ng, XRay, DNS Recon, and tools marked with (T))

All tools verified as live and accessible as of 2026-03-27.
