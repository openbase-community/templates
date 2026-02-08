import ProjectDescription

let project = Project(
    name: "$${name_pascal}",
    options: .options(
        automaticSchemesOptions: .disabled
    ),
    settings: .settings(
        base: [
            "DEVELOPMENT_TEAM": "$${apple_team_id}",
        ],
        configurations: [
            .debug(name: "Debug"),
            .release(name: "Release"),
        ]
    ),
    targets: [
        .target(
            name: "$${name_pascal}",
            destinations: [.iPhone, .iPad],
            product: .app,
            bundleId: "$${bundle_id}",
            deploymentTargets: .iOS("18.0"),
            infoPlist: .extendingDefault(with: [
                "UILaunchScreen": .dictionary([:]),
            ]),
            sources: ["$${name_pascal}/**"],
            resources: ["$${name_pascal}/Assets.xcassets", "$${name_pascal}/Preview Content/**"],
            dependencies: [
                .external(name: "OpenbaseShared"),
            ],
            settings: .settings(
                base: [
                    "CODE_SIGN_STYLE": "Automatic",
                    "ENABLE_PREVIEWS": "YES",
                ]
            )
        ),
        .target(
            name: "$${name_pascal}Tests",
            destinations: [.iPhone, .iPad],
            product: .unitTests,
            bundleId: "$${bundle_id}.tests",
            deploymentTargets: .iOS("18.0"),
            sources: ["$${name_pascal}Tests/**"],
            dependencies: [
                .target(name: "$${name_pascal}"),
            ]
        ),
        .target(
            name: "$${name_pascal}UITests",
            destinations: [.iPhone, .iPad],
            product: .uiTests,
            bundleId: "$${bundle_id}.uitests",
            deploymentTargets: .iOS("18.0"),
            sources: ["$${name_pascal}UITests/**"],
            dependencies: [
                .target(name: "$${name_pascal}"),
            ]
        ),
    ],
    schemes: [
        .scheme(
            name: "$${name_pascal}",
            shared: true,
            buildAction: .buildAction(targets: ["$${name_pascal}"]),
            testAction: .targets(["$${name_pascal}Tests", "$${name_pascal}UITests"]),
            runAction: .runAction(configuration: "Debug", executable: "$${name_pascal}")
        ),
    ]
)
