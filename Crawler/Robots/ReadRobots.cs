using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Crawler.Results;
using Crawler.Robots.UrlMatchers;

namespace Crawler.Robots
{
    public class ReadRobots: IRobots
    {
        private readonly IClient _client;
        private readonly IColoredLineWriter _coloredLineWriter;

        public ReadRobots(IClient client, IColoredLineWriter coloredLineWriter)
        {
            _client = client;
            _coloredLineWriter = coloredLineWriter;
        }

        public async Task AddRulesToDomain(Domain domain)
        {
            if (domain.Robots != null)
            {
                return;
            }

            Uri robotsTxt = new Uri(domain.Url, "robots.txt");
            var result = await _client.Get(robotsTxt);
            if (result is SuccessResult success)
            {
                IRobotsRule rule = GetRuleFromContent(success.Content);
                if (rule != null)
                {
                    domain.Robots = rule;
                }
            }
            else if (result is ErrorResult error)
            {
                _coloredLineWriter.WriteLine($"Could not get {robotsTxt}:" + error.Message, ConsoleColor.Red);
                domain.Robots = new NoopRobotsRule();
            }
        }

        private IRobotsRule GetRuleFromContent(string content)
        {
            content = Regex.Replace(content, @"#.*$", "", RegexOptions.Multiline);
            _coloredLineWriter.WriteLine(content, ConsoleColor.Blue);
            var match = new Regex(@"User-agent: \*(?:\s*(?:Disallow|Allow|Crawl-delay):.*?)*").Match(content);
            var noop = new NoopRobotsRule();
            if (!match.Success)
            {
                return noop;
            }

            string forAllAgents = match.Value;
            var disallowed = GetUrlMatchers(new Regex(@"Disallow:(.*)").Matches(forAllAgents).Select(m => m.Groups[1].Value)).ToList();
            var allowed = GetUrlMatchers(new Regex(@"Allow:(.*)").Matches(forAllAgents).Select(m => m.Groups[1].Value)).ToList();
            return new RobotsRule(allowed, disallowed);
        }

        private static IEnumerable<UrlMatcher> GetUrlMatchers(IEnumerable<string> matchers)
        {
            foreach (var matcher in matchers)
            {
                if (UrlMatcher.TryParse(matcher, out var urlMatcher))
                {
                    yield return urlMatcher;
                }
            }
        }
    }
}
