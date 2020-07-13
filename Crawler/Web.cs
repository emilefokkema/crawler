using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Crawler.Robots;

namespace Crawler
{
    public class Web
    {
        private readonly IUrlQueue _urlQueue;
        private List<Link> _links;
        private readonly IRobots _robots;
        private readonly IColoredLineWriter _coloredLineWriter;
        private readonly ConcurrentDictionary<string, Domain> _domains;

        public Web(IUrlQueue urlQueue, IRobots robots, IColoredLineWriter coloredLineWriter)
        {
            _urlQueue = urlQueue;
            _links = new List<Link>();
            _robots = robots;
            _domains = new ConcurrentDictionary<string, Domain>();
            _coloredLineWriter = coloredLineWriter;
        }

        public void AddLinks(Uri from, IEnumerable<Uri> to)
        {
            List<Uri> urlsToEnqueue = new List<Uri>();
            foreach (Uri toUrl in to)
            {
                if (_links.Any(l => l.From.Equals(from) && l.To.Equals(toUrl)))
                {
                    continue;
                }

                if (!_links.Any(l => l.To.Equals(toUrl)))
                {
                    urlsToEnqueue.Add(toUrl);
                }
                _links.Add(new Link(from, toUrl));
            }

            if (urlsToEnqueue.Count == 0)
            {
                _coloredLineWriter.WriteLine("No new urls to enqueue", ConsoleColor.Yellow);
            }

            foreach (var urlToEnqueue in urlsToEnqueue)
            {
                _coloredLineWriter.WriteLine($"adding {urlToEnqueue} to queue", ConsoleColor.Green);
                _urlQueue.Add(urlToEnqueue);
            }
        }

        public bool AllowsVisitToUrl(Uri url)
        {
            if (!TryGetDomainForUrl(url, out Domain domain)) 
            {
                return false;
            }
            var result = domain.AllowsVisitToUrl(url);
            if (!result) 
            {
                _coloredLineWriter.WriteLine($"domain {domain.Url} does not allow visiting {url}", ConsoleColor.Red);
            }
            return result;
        }

        private bool TryGetDomainForUrl(Uri url, out Domain domain)
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

        public async Task VisitDomain(Uri uri)
        {
            if (!TryGetDomainForUrl(uri, out Domain domain))
            {
                return;
            }

            await _robots.AddRulesToDomain(domain);
        }
    }
}
