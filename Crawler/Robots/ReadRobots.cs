using System;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Crawler.Results;

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
            Uri robotsTxt = new Uri(domain.Url, "robots.txt");
            var result = await _client.Get(robotsTxt);
            if (result is SuccessResult success)
            {
                IRobotsRule rule = GetRuleFromContent(success.Content);
                if (rule != null)
                {
                    domain.SetRobotsRule(rule);
                }
            }
            else if (result is ErrorResult error)
            {
                _coloredLineWriter.WriteLine($"Could not get {robotsTxt}:" + error.Message, ConsoleColor.Red);
            }
        }

        private IRobotsRule GetRuleFromContent(string content)
        {
            content = Regex.Replace(content, @"#.*$", "", RegexOptions.Multiline);
            _coloredLineWriter.WriteLine(content, ConsoleColor.Blue);
            var match = new Regex(@"User-agent: \*(?:\s*(?:Disallow|Allow|Crawl-delay):.*?)*").Match(content);
            if (!match.Success)
            {
                return null;
            }

            string forAllAgents = match.Value;
            var disallowed = new Regex(@"Disallow:(.*)").Matches(forAllAgents);
            var allowed = new Regex(@"Allow:(.*)").Matches(forAllAgents);
            return null;
        }
    }
}
