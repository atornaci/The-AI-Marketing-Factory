import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: ["/api/", "/dashboard/", "/project/", "/auth/"],
            },
        ],
        sitemap: "https://creatorpersonaai.com/sitemap.xml",
    };
}
