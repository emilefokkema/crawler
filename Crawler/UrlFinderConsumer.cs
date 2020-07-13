using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System;
using Crawler.Results;

namespace Crawler
{
    public class UrlFinderConsumer: IResultConsumer
    {
        private readonly Regex _urlRegex;
        private readonly Regex _unwantedUrlRegex;
        private readonly Web _web;
        private readonly IColoredLineWriter _coloredLineWriter;
        public UrlFinderConsumer(Web web, IColoredLineWriter coloredLineWriter)
        {
            _coloredLineWriter = coloredLineWriter;
            _urlRegex = BuildUrlRegex();
            _unwantedUrlRegex = new Regex(@"\.(?!html?)[a-z0-9]+(?:$|\?)", RegexOptions.IgnoreCase);
            _web = web;
        }

        private static Regex BuildUrlRegex()
        {
            string domainNamePart = @"[0-9a-z_\-]+";
            string domainName = $"(?:{domainNamePart}\\.)+{domainNamePart}";
            string directory = @"[0-9a-z_\-]+";
            string fileNameBeforeExtension = @"[0-9a-z_\-+]+";
            string fileName = $"{fileNameBeforeExtension}(?:\\.[a-z0-9]+)*";
            string path = $"(?:/{directory})*/(?:{fileName})?";
            string queryParamName = @"[0-9a-z_\-]+";
            string queryParamValue = @"[0-9a-z_\-=]*";
            string queryParam = $"{queryParamName}={queryParamValue}";
            string queryString = $"\\?{queryParam}(?:&{queryParam})*";
            return new Regex($"https?://{domainName}(?:{path})?(?:{queryString})?", RegexOptions.IgnoreCase);
        }

        public void Consume(Result result)
        {
            if (result is RedirectResult redirect)
            {
                _coloredLineWriter.WriteLine($"Redirected to {redirect.Location}", ConsoleColor.Green);
                _web.AddLinks(redirect.OriginalLocation, new List<Uri>{redirect.Location});
                return;
            }

            if (!(result is SuccessResult success))
            {
                return;
            }

            List<Uri> matches = _urlRegex.Matches(success.Content).Select(m => new Uri(m.Value)).Distinct().ToList();
            matches = matches.Where(m => !m.Equals(success.Url) && !_unwantedUrlRegex.IsMatch(m.ToString())).ToList();
            _web.AddLinks(success.Url, matches);
        }
    }
}
