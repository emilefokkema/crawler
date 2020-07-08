using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System;

namespace Crawler
{
    public class UrlFinderConsumer: IResultConsumer
    {
        private Regex _urlRegex;
        private readonly List<ILinkConsumer> _linkConsumers;
        public UrlFinderConsumer(IEnumerable<ILinkConsumer> linkConsumers)
        {
            _urlRegex = new Regex(@"https?://(?:[a-z]+\.)*[a-z]+(?:/[a-z]+)*/?");
            _linkConsumers = linkConsumers.ToList();
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
                var link = new Link(success.Url, new Uri(match.Value));
                foreach (var linkConsumer in _linkConsumers) 
                {
                    linkConsumer.Consume(link);
                }
            }
        }
    }
}
