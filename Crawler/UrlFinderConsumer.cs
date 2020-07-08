using System;
using System.Collections;
using System.Collections.Generic;
using System.Text.RegularExpressions;

namespace Crawler
{
    public class UrlFinderConsumer: IResultConsumer
    {
        private Regex _urlRegex;
        private readonly IUrlQueue _urlQueue;
        public UrlFinderConsumer(IUrlQueue urlQueue)
        {
            _urlQueue = urlQueue;
            _urlRegex = new Regex(@"https?://(?:[a-z]+\.)*[a-z]+(?:/[a-z]+)*/?");
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
                Console.WriteLine($"found url {match.Value}");
                _urlQueue.Add(match.Value);
            }
        }
    }
}
