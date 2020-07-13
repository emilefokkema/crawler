using System;
using System.Collections.Generic;
using Crawler.Robots.UrlMatchers;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace Crawler.Tests
{
    [TestClass]
    public class PathUrlMatcherTests
    {
        private enum Partial
        {
            All, None
        }

        private bool MatcherMatchesUrl(UrlMatcher pathMatcher, string urlRelativeToRoot)
        {
            var uri = new Uri(new Uri("http://host.name"), urlRelativeToRoot);
            return pathMatcher.Matches(uri);
        }

        private void AssertPatternMatchesUrls(string pattern, Partial partial, string[] urls)
        {
            UrlMatcher.TryParse(pattern, out var pathMatcher);
            foreach (var url in urls)
            {
                var matches = MatcherMatchesUrl(pathMatcher, url);
                if (matches && partial == Partial.None || !matches && partial == Partial.All)
                {
                    Assert.Fail();
                }
            }
        }

        private void AssertPatternMatchesAllUrls(string pattern, params string[] urls)
        {
            AssertPatternMatchesUrls(pattern, Partial.All, urls);
        }

        private void AssertPatternMatchesNoUrls(string pattern, params string[] urls)
        {
            AssertPatternMatchesUrls(pattern, Partial.None, urls);
        }

        [TestMethod]
        public void TestMethod1()
        {
            AssertPatternMatchesAllUrls("/", "foo");
            AssertPatternMatchesAllUrls("/*", "foo");

            AssertPatternMatchesAllUrls("/fish", "fish", "fish.html", "fish/salmon.html", "fishheads", "fishheads/yummy.html", "fish.php?id=anything");
            AssertPatternMatchesNoUrls("/fish", "Fish.asp", "catfish", "/?id=fish");

            AssertPatternMatchesAllUrls("/fish*", "fish", "fish.html", "fish/salmon.html", "fishheads", "fishheads/yummy.html", "fish.php?id=anything");
            AssertPatternMatchesNoUrls("/fish*", "Fish.asp", "catfish", "/?id=fish");

            AssertPatternMatchesAllUrls("/fish/", "fish/", "fish/?id=anything", "fish/salmon.htm");
            AssertPatternMatchesNoUrls("/fish/", "fish", "fish.html", "Fish/Salmon.asp");

            AssertPatternMatchesAllUrls("/*.php", "filename.php", "folder/filename.php", "folder/filename.php?parameters", "folder/any.php.file.html", "filename.php/");
            AssertPatternMatchesNoUrls("/*.php", "/", "windows.PHP");

            AssertPatternMatchesAllUrls("/*.php$", "filename.php", "folder/filename.php");
            AssertPatternMatchesNoUrls("/*.php$", "filename.php?parameters", "filename.php/", "filename.php5", "windows.PHP");

            AssertPatternMatchesAllUrls("/fish*.php", "fish.php", "fishtank.php", "fishheads/catfish.php?parameters");
            AssertPatternMatchesNoUrls("/fish*.php", "Fish.php");
        }
    }
}
