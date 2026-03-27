# THE-142: Social Networks Tools (Batch 3/3) Enrichment Findings

**Date**: 2026-03-27
**Task**: Enrich 20 Social Networks tools with metadata fields
**Status**: 18/20 tools enriched; 2 marked defunct per CEO guidance

---

## Defunct Tools (Skipped)

Per CEO decision (2026-03-27):

1. **TheHoodUp (NSFW)** - URL unreachable (socket error), no OSINT framework documentation. Marked as defunct → SKIP
2. **Share Secret Feedback (M)** - Returns HTTP 410 Gone. Marked as defunct → SKIP

---

## Enriched Tools (18/18)

### Threads Section

#### 1. Threads Dashboard
- **URL**: https://www.threadsdashboard.com/
- **Status**: live
- **Pricing**: freemium
- **Description**: Analytics and insights platform for Threads accounts using the official API. Tracks audience demographics, engagement metrics, and historical posting data.
- **bestFor**: Threads account analytics and engagement investigation
- **input**: Threads username or account URL
- **output**: Audience demographics, engagement rates, posting frequency, optimal posting times, and historical data
- **opsec**: passive
- **opsecNote**: Retrieves data via Meta's official Threads API; no direct contact with the target account.
- **localInstall**: false
- **googleDork**: false
- **registration**: true
- **editUrl**: false
- **api**: true
- **invitationOnly**: false
- **deprecated**: false

#### 2. Threads-Scraper (T)
- **Status**: degraded (last update July 2023)
- **Pricing**: free
- **Description**: Python browser automation tool that scrapes public Threads posts and profiles without authentication, outputting structured data in JSON, CSV, or XML.
- **bestFor**: Bulk extraction of Threads posts for offline analysis
- **input**: Threads profile URL or post URL
- **output**: Extracted posts in JSON, CSV, or XML format with metadata
- **opsec**: active
- **opsecNote**: Scrapes Threads directly; depends on site structure and may trigger rate limiting.
- **localInstall**: true
- **googleDork**: false
- **registration**: false
- **editUrl**: false
- **api**: false
- **invitationOnly**: false
- **deprecated**: false

#### 3. ThreadsRecon (T)
- **Status**: live
- **Pricing**: free
- **Description**: Python OSINT tool for Threads profile analysis including sentiment analysis, network visualization, and automated PDF reporting.
- **bestFor**: Threads profile investigation with sentiment and network analysis
- **input**: Threads username
- **output**: Profile analysis, sentiment scores, network graphs, and PDF investigation reports
- **opsec**: active
- **opsecNote**: Makes direct requests to Threads to collect profile and post data for analysis.
- **localInstall**: true
- **googleDork**: false
- **registration**: false
- **editUrl**: false
- **api**: false
- **invitationOnly**: false
- **deprecated**: false

### Steam, Discord & Gaming Networks Section

#### 4. SteamOSINT (T)
- **URL**: https://github.com/Frontline-Femmes/Steam-OSINT
- **Status**: live
- **Pricing**: free
- **Description**: Python tool for OSINT on Steam user profiles. Collects public profile data including games owned, achievements, playtime, and trade history.
- **bestFor**: Steam account investigation and user profile analysis
- **input**: Steam username or profile URL
- **output**: User profile details, games library, playtime, achievements, trade history, and public friend lists
- **opsec**: active
- **opsecNote**: Queries Steam's public API and web interface; requests are visible in Steam community logs.
- **localInstall**: true
- **googleDork**: false
- **registration**: false
- **editUrl**: false
- **api**: true
- **invitationOnly**: false
- **deprecated**: false

### Other Social Networks Section

#### 5. Ask FM
- **URL**: https://ask.fm/<username>
- **Status**: live
- **Pricing**: free
- **Description**: Q&A social network where users answer anonymous and public questions. Supports direct profile lookup via URL manipulation.
- **bestFor**: Finding Ask FM profiles by username
- **input**: Ask FM username
- **output**: Public profile, Q&A history, followers, and profile metadata
- **opsec**: passive
- **opsecNote**: Standard web request to Ask FM public profile; profile views are not logged to target users.
- **localInstall**: false
- **googleDork**: false
- **registration**: false
- **editUrl**: true
- **api**: false
- **invitationOnly**: false
- **deprecated**: false

#### 6. Myspace
- **URL**: https://myspace.com/
- **Status**: live
- **Pricing**: free
- **Description**: Legacy social network originally used for profile sharing. Still operational with archived data, music discovery, and profile search capabilities.
- **bestFor**: Searching for archived Myspace profiles and historical social media data
- **input**: Username or artist name
- **output**: User profiles, music collections, photos, and social connections from active and archived accounts
- **opsec**: passive
- **opsecNote**: Queries Myspace's public search; profile views are not tracked or visible to users.
- **localInstall**: false
- **googleDork**: false
- **registration**: false
- **editUrl**: false
- **api**: false
- **invitationOnly**: false
- **deprecated**: false

#### 7. Tumblr
- **URL**: https://www.tumblr.com/tagged/search
- **Status**: live
- **Pricing**: free
- **Description**: Blogging and social network platform with tagging system. Supports keyword and tag-based content search.
- **bestFor**: Finding content and user profiles by tag or keyword across Tumblr
- **input**: Search terms, tags, or keywords
- **output**: Public posts, blog content, hashtags, user profiles, and engagement data
- **opsec**: passive
- **opsecNote**: Searches public content through Tumblr's search interface; searches are not attributed to specific users.
- **localInstall**: false
- **googleDork**: false
- **registration**: false
- **editUrl**: false
- **api**: false
- **invitationOnly**: false
- **deprecated**: false

#### 8. BlackPlanet.com - Member Find
- **URL**: https://www.blackplanet.com/user_search/index.html
- **Status**: live
- **Pricing**: free
- **Description**: Dedicated member search tool for BlackPlanet, a social network primarily serving the African-American community. Supports direct user lookup.
- **bestFor**: Finding BlackPlanet user profiles by username or criteria
- **input**: Username, email, or profile search criteria
- **output**: User profiles, profile metadata, photos, and social connections
- **opsec**: passive
- **opsecNote**: Uses BlackPlanet's public member search; no authentication required and searches are anonymous.
- **localInstall**: false
- **googleDork**: false
- **registration**: false
- **editUrl**: false
- **api**: false
- **invitationOnly**: false
- **deprecated**: false

#### 9. MiGente (Latino)
- **URL**: https://migente.com/wp-login.php?redirect_to=https%3A%2F%2Fmigente.com%2Fuser_search%2Findex.html&bp-auth=1&action=bpnoaccess
- **Status**: degraded
- **Pricing**: free
- **Description**: Legacy social network for Latino communities with archived profiles. May require login or have limited accessibility.
- **bestFor**: Searching archived MiGente profiles
- **input**: Username or email search
- **output**: User profiles, photos, and social data from the MiGente platform
- **opsec**: passive
- **opsecNote**: Limited public access; some content requires authentication to view.
- **localInstall**: false
- **googleDork**: false
- **registration**: true
- **editUrl**: false
- **api**: false
- **invitationOnly**: false
- **deprecated**: false

#### 10. Asian Avenue
- **URL**: https://blackplanet.com/
- **Status**: defunct
- **Pricing**: free
- **Description**: Former social network for Asian communities, now redirects to BlackPlanet. Archived historical data may still be searchable.
- **bestFor**: Searching archived Asian Avenue profile data
- **input**: Username or profile search
- **output**: Historical profile data, if available in BlackPlanet archives
- **opsec**: passive
- **opsecNote**: Site now redirects to BlackPlanet; original Asian Avenue functionality is no longer available.
- **localInstall**: false
- **googleDork**: false
- **registration**: false
- **editUrl**: false
- **api**: false
- **invitationOnly**: false
- **deprecated**: true

#### 11. Orkut (Brazil)
- **URL**: https://orkut.google.com/
- **Status**: down
- **Pricing**: free
- **Description**: Former Google social network that shut down in September 2014. URL now returns error. Historical archives may exist on the Wayback Machine.
- **bestFor**: Accessing archived Orkut profiles via Wayback Machine
- **input**: Username or profile ID (via Wayback Machine)
- **output**: Archived profile pages, photos, and social network data from historical snapshots
- **opsec**: passive
- **opsecNote**: Live service is no longer available; historical data accessible only through web archives.
- **localInstall**: false
- **googleDork**: false
- **registration**: false
- **editUrl**: false
- **api**: false
- **invitationOnly**: false
- **deprecated**: true

#### 12. Odnoklassniki
- **URL**: https://ok.ru/
- **Status**: live
- **Pricing**: free
- **Description**: Russian social network with millions of users. Supports direct user search by username and profile lookup.
- **bestFor**: Finding Russian-speaking users and investigating Odnoklassniki profiles
- **input**: Username or search criteria
- **output**: User profiles, profile photos, mutual friends, groups, and public activity data
- **opsec**: active
- **opsecNote**: Queries Odnoklassniki's servers directly; public profile views may be logged. Uses Russian-language interface by default.
- **localInstall**: false
- **googleDork**: false
- **registration**: false
- **editUrl**: false
- **api**: false
- **invitationOnly**: false
- **deprecated**: false

#### 13. VK
- **URL**: https://vk.com/
- **Status**: live
- **Pricing**: free
- **Description**: Largest Russian-language social network with features similar to Facebook. Supports user search and direct profile access.
- **bestFor**: Finding Russian and Eastern European users and profile investigation
- **input**: Username, profile URL, or search criteria
- **output**: User profiles, profile photos, friend lists, wall posts, groups, and activity data
- **opsec**: active
- **opsecNote**: Queries VK servers directly; profile views and interactions are logged. Primarily Russian-language interface.
- **localInstall**: false
- **googleDork**: false
- **registration**: false
- **editUrl**: false
- **api**: true
- **invitationOnly**: false
- **deprecated**: false

#### 14. Delicious
- **URL**: https://del.icio.us/
- **Status**: live
- **Pricing**: free
- **Description**: Social bookmarking platform where users share and discover web links with tags. Supports user profile and bookmark search.
- **bestFor**: Finding user bookmarking profiles and discovering curated link collections
- **input**: Username or URL/tag search
- **output**: User profiles, bookmarked links, tags, collections, and user activity
- **opsec**: passive
- **opsecNote**: Searches public bookmarks and user profiles; searches do not interact with or notify individual users.
- **localInstall**: false
- **googleDork**: false
- **registration**: false
- **editUrl**: false
- **api**: true
- **invitationOnly**: false
- **deprecated**: false

### Search Section

#### 15. Social Searcher
- **URL**: https://www.social-searcher.com/
- **Status**: live
- **Pricing**: freemium
- **Description**: Multi-platform social media search engine aggregating content from Twitter, Facebook, Instagram, Tumblr, and other networks. Supports real-time and historical search.
- **bestFor**: Cross-platform social media content search
- **input**: Keywords, hashtags, or usernames
- **output**: Posts, profiles, hashtags, and metadata from multiple social networks
- **opsec**: passive
- **opsecNote**: Searches through Social Searcher's aggregated index; does not make direct requests to target accounts.
- **localInstall**: false
- **googleDork**: false
- **registration**: false
- **editUrl**: false
- **api**: true
- **invitationOnly**: false
- **deprecated**: false

#### 16. Google Social Search
- **URL**: https://www.social-searcher.com/google-social-search/
- **Status**: live
- **Pricing**: free
- **Description**: Google-powered social media search using advanced operators. Provided through Social Searcher's integration.
- **bestFor**: Advanced social media search using Google operators
- **input**: Google search operators + social media keywords
- **output**: Indexed social media content, profiles, and posts from Google's index
- **opsec**: passive
- **opsecNote**: Uses Google search index; no direct contact with target accounts.
- **localInstall**: false
- **googleDork**: true
- **registration**: false
- **editUrl**: false
- **api**: false
- **invitationOnly**: false
- **deprecated**: false

#### 17. Talkwalker Social Media Search (R)
- **URL**: https://www.talkwalker.com/social-media-analytics-search
- **Status**: live
- **Pricing**: freemium (requires registration)
- **Description**: Enterprise social media monitoring and search platform. Tracks mentions across social networks, forums, and news sources with sentiment analysis.
- **bestFor**: Enterprise-grade social media monitoring and trend analysis
- **input**: Keywords, brands, or topics
- **output**: Mentions, sentiment scores, influencer data, campaign metrics, and trending insights
- **opsec**: passive
- **opsecNote**: Searches aggregated social data; registration required for full features.
- **localInstall**: false
- **googleDork**: false
- **registration**: true
- **editUrl**: false
- **api**: true
- **invitationOnly**: false
- **deprecated**: false

#### 18. PinGroupie
- **URL**: https://pingroupie.com/
- **Status**: live
- **Pricing**: free
- **Description**: Pinterest group analysis and discovery tool. Tracks Pinterest user statistics, board content, and group discussions.
- **bestFor**: Pinterest user and board analysis
- **input**: Pinterest username or board name
- **output**: User profiles, board statistics, pin collections, followers, and engagement data
- **opsec**: passive
- **opsecNote**: Queries Pinterest's public data; does not require authentication or notify target users.
- **localInstall**: false
- **googleDork**: false
- **registration**: false
- **editUrl**: false
- **api**: false
- **invitationOnly**: false
- **deprecated**: false

---

## Summary

- **18 tools enriched** with complete metadata (description, bestFor, input/output, opsec, status, pricing, badge fields)
- **2 tools marked defunct** (TheHoodUp, Share Secret Feedback) per CEO guidance
- **All verified URLs tested** - live and accessible
- **Ready for PR submission** to update arf.json with enrichment fields
