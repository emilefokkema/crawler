using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;

namespace Crawler
{
    public class Web
    {
        private readonly List<Link> _links;
        private readonly ConcurrentDictionary<string, Domain> _domains;

        public Web()
        {
            _links = new List<Link>();
            _domains = new ConcurrentDictionary<string, Domain>();
        }

        public bool ContainsUrl(Uri url)
        {
            return _links.Any(l => l.To.Equals(url) || l.From.Equals(url));
        }

        public void AddLinks(Uri from, IEnumerable<Uri> to)
        {
            foreach (Uri toUrl in to)
            {
                if (_links.Any(l => l.From.Equals(from) && l.To.Equals(toUrl)))
                {
                    continue;
                }
                _links.Add(new Link(from, toUrl));
            }
        }

        public bool AllowsVisitToUrl(Uri url)
        {
            if (!TryGetDomainForUrl(url, out Domain domain)) 
            {
                return false;
            }
            return domain.AllowsVisitToUrl(url);
        }

        public bool TryGetDomainForUrl(Uri url, out Domain domain)
        {
            string domainName = Domain.GetKeyForUrl(url);
            if (_domains.ContainsKey(domainName))
            {
                domain = _domains[domainName];
                return true;
            }

            var newDomain = Domain.CreateForUrl(url);
            if (_domains.TryAdd(domainName, newDomain))
            {
                domain = newDomain;
                return true;
            }

            domain = default;
            return false;
        }
    }
}
