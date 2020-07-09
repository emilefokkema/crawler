using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Crawler.Results;

namespace Crawler
{
    public class Web
    {
        private readonly IUrlQueue _urlQueue;
        private List<Link> _links;
        private readonly IColoredLineWriter _coloredLineWriter;
        private readonly IClient _client;
        private readonly ConcurrentDictionary<string, Domain> _domains;

        public Web(IUrlQueue urlQueue, IColoredLineWriter coloredLineWriter, IClient client)
        {
            _urlQueue = urlQueue;
            _coloredLineWriter = coloredLineWriter;
            _links = new List<Link>();
            _client = client;
            _domains = new ConcurrentDictionary<string, Domain>();
        }

        public void AddLink(Link link)
        {
            if (_links.Any(l => l.From.Equals(link.To)))
            {
                return;
            }

            _urlQueue.Add(link.To);
        }

        public async Task AddDomainFor(Uri uri)
        {
            string domain = uri.Authority;
            if (!_domains.TryAdd(domain, new Domain()))
            {
                return;
            }

            Uri robotsTxt = new Uri(new Uri($"{uri.Scheme}://{uri.Host}"), "robots.txt");
            var result = await _client.Get(robotsTxt);
            if (result is SuccessResult success)
            {
                _coloredLineWriter.WriteLine(success.Content, ConsoleColor.Blue);
            }
            else if(result is ErrorResult error)
            {
                _coloredLineWriter.WriteLine($"Could not get {robotsTxt}:" + error.Message, ConsoleColor.Red);
            }
        }
    }
}
