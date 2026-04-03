# OSINT Framework

http://osintframework.com

## Notes
OSINT framework focused on gathering information from free tools or resources. The intention is to help people find free OSINT resources. Some of the sites included might require registration or offer more data for $$$, but you should be able to get at least a portion of the available information for no cost.

I originally created this framework with an information security point of view. Since then, the response from other fields and disciplines has been incredible. I would love to be able to include any other OSINT resources, especially from fields outside of infosec. Please let me know about anything that might be missing!

Please visit the framework at the link below and good hunting!

https://osintframework.com

### Legend

#### Name Markers
(T) - Indicates a link to a tool that must be installed and run locally
(D) - Google Dork, for more information: <a href="https://en.wikipedia.org/wiki/Google_hacking">Google Hacking</a>
(R) - Requires registration
(M) - Indicates a URL that contains the search term and the URL itself must be edited manually

#### Tool Metadata Fields
Each tool entry in `arf.json` can include structured metadata beyond the name and URL:

| Field | Type | Description |
|-------|------|-------------|
| `description` | string | What the tool does |
| `status` | string | `live`, `degraded`, `down`, or `deprecated` |
| `pricing` | string | `free`, `freemium`, or `paid` |
| `bestFor` | string | Primary use case in one line |
| `input` | string | What the tool takes as input |
| `output` | string | What the tool returns |
| `opsec` | string | `passive` or `active` |
| `opsecNote` | string | Operational security considerations |
| `localInstall` | boolean | Corresponds to `(T)` marker |
| `googleDork` | boolean | Corresponds to `(D)` marker |
| `registration` | boolean | Corresponds to `(R)` marker |
| `editUrl` | boolean | Corresponds to `(M)` marker |
| `api` | boolean | Whether the tool offers an API |
| `invitationOnly` | boolean | Whether access requires an invitation |
| `deprecated` | boolean | Whether the tool is deprecated |

### For Update Notifications
Follow me on Twitter: @jnordine - https://twitter.com/jnordine  
Watch or star the project on Github: https://github.com/lockfale/osint-framework

### Suggestions, Comments, Feedback
Feedback or new tool suggestions are extremely welcome!  Please feel free to submit a pull request or open an issue on github or reach out on Twitter.

### Contribute with a GitHub Pull Request
For new resources, please ensure that the site is available for public and free use.

1. Update `arf.json` with your new tool entry in the appropriate category folder. Use the enriched format below:

```json
{
  "name": "Example Name (T)",
  "type": "url",
  "url": "https://example.com",
  "description": "Brief description of what the tool does and its key capabilities.",
  "status": "live",
  "pricing": "free",
  "bestFor": "Primary use case in one sentence",
  "input": "What the tool accepts (e.g., Username, Domain, IP address)",
  "output": "What the tool returns (e.g., Profile matches, DNS records)",
  "opsec": "passive",
  "opsecNote": "Any operational security considerations for using this tool.",
  "localInstall": true,
  "googleDork": false,
  "registration": false,
  "editUrl": false,
  "api": false,
  "invitationOnly": false,
  "deprecated": false
}
```

At a minimum, include `name`, `type`, and `url`. The metadata fields are strongly encouraged as they help users understand each tool at a glance.

Append `(T)`, `(D)`, `(R)`, or `(M)` to the name when applicable, and set the corresponding boolean field to `true`.

2. Submit your pull request!

## OSINT Framework Website

https://osintframework.com

Happy Hunting!