//
//  ClashOpsApp.swift
//  ClashOps
//
//  Created by Matthew Riley on 2025-08-21.
//


// Imports
import SwiftUI

@main
struct ClashOpsApp: App {
    let persistenceController = PersistenceController.shared
    @StateObject var popupController = PopupController()

    var body: some Scene {
        WindowGroup {
            RootView().environment(\.managedObjectContext,
                                    persistenceController.container.viewContext)
                            .environmentObject(popupController)
        }
    }
}
