// swift-tools-version:5.10
import PackageDescription

let package = Package(
  name: "cove_workers",
  products: [
    .executable(name: "cove_workers", targets: ["cove_workers"]),
  ],
  targets: [
    .executableTarget(
      name: "cove_workers",
      path: "Sources/cove_workers"
    ),
  ]
)
