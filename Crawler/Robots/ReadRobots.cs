using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Crawler.Logging;
using Crawler.Results;
using Crawler.Robots.UrlMatchers;

namespace Crawler.Robots
{
    public class ReadRobots: IRobots
    {
        private readonly IClient _client;
        private readonly ILogger _logger;

        public ReadRobots(IClient client, ILogger logger)
        {
            _client = client;
            _logger = logger;
        }

        public Task AddRulesToDomain(Domain domain)
        {
            if (domain.RobotsRuleIsBeingSet)
            {
                return domain.WhenRobotsRuleHasBeenSet;
            }

            if (domain.Robots != null)
            {
                return Task.CompletedTask;
            }

            domain.RobotsRuleIsBeingSet = true;
            domain.WhenRobotsRuleHasBeenSet = Task.Run(async () =>
            {
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
                    _logger.LogWarning($"Could not get robots.txt:" + error.Message);
                    domain.Robots = new NoopRobotsRule();
                }

                domain.RobotsRuleIsBeingSet = false;
            });
            return domain.WhenRobotsRuleHasBeenSet;
        }

        private IRobotsRule GetRuleFromContent(string content)
        {
            content = Regex.Replace(content, @"#.*$", "", RegexOptions.Multiline);
            var match = new Regex(@"User-agent: \*(?:\s*(?:Disallow|Allow|Crawl-delay):.*)*").Match(content);
            var noop = new NoopRobotsRule();
            if (!match.Success)
            {
                return noop;
            }

            string forAllAgents = match.Value;
            var disallowed = GetUrlMatchers(new Regex(@"Disallow:(.*)").Matches(forAllAgents).Select(m => m.Groups[1].Value)).ToList();
            var allowed = GetUrlMatchers(new Regex(@"Allow:(.*)").Matches(forAllAgents).Select(m => m.Groups[1].Value)).ToList();
            _logger.LogDebug($"found robots rule with {disallowed.Count} disallowed and {allowed.Count} allowed");
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
