using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System;
using System.Threading.Tasks;

namespace Crawler
{
    public class UrlFinderConsumer: IResultConsumer
    {
        private Regex _urlRegex;
        private readonly List<ILinkConsumer> _linkConsumers;
        private readonly IColoredLineWriter _coloredLineWriter;
        public UrlFinderConsumer(IEnumerable<ILinkConsumer> linkConsumers, IColoredLineWriter coloredLineWriter)
        {
            _coloredLineWriter = coloredLineWriter;
            _urlRegex = BuildUrlRegex();
            _linkConsumers = linkConsumers.ToList();
        }

        private static Regex BuildUrlRegex()
        {
            string domainNamePart = @"[0-9a-z_\-]+";
            string domainName = $"(?:{domainNamePart}\\.)+{domainNamePart}";
            string directory = @"[0-9a-z_\-]+";
            string fileNameBeforeExtension = @"[0-9a-z_\-+]+";
            string fileName = $"{fileNameBeforeExtension}(?:\\.[a-z0-9]+)?";
            string path = $"(/{directory})*/(?:{fileName})?";
            string queryParamName = @"[0-9a-z_\-]+";
            string queryParamValue = @"[0-9a-z_\-]*";
            string queryParam = $"{queryParamName}={queryParamValue}";
            string queryString = $"\\?{queryParam}(?:&{queryParam})*";
            return new Regex($"https?://{domainName}(?:{path})?(?:{queryString})?", RegexOptions.IgnoreCase);
        }

        public void Consume(Result result)
        {
            if (!(result is SuccessResult success))
            {
                return;
            }
            IList<Match> matches = _urlRegex.Matches(success.Content);
            foreach (var match in matches)
            {
                PrintMatchEnvironment(match, success.Content);
                var link = new Link(success.Url, new Uri(match.Value));
                foreach (var linkConsumer in _linkConsumers) 
                {
                    linkConsumer.Consume(link);
                }
            }
        }

        private void PrintMatchEnvironment(Match match, string source)
        {
            string before = source.Substring(match.Index - 5, 5);
            string after = source.Substring(match.Index + match.Value.Length, 5);
            _coloredLineWriter.WriteLine($"{before} [ {match.Value}  ]  {after}", ConsoleColor.Green);
        }
    }
}
