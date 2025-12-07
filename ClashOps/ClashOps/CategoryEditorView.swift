//
//  CategoryBuilderView.swift
//  ClashOps
//
//  Created by Matthew Riley on 2025-09-15.
//


//MARK: Imports
import SwiftUI
import CoreData

struct CategoryEditorView: View {
  
    
    //MARK: Variable declarations
    @Environment(\.dismiss) private var dismiss
    @State private var selectedColor: String = "Red"
    @State private var colorOptions: [String] = ["Red", "Blue", "Green", "Yellow", "Gray", "Purple", "Brown"]
    @State private var newName: String = "My New Category"
    @State private var categoryIcon = ""
    @ObservedObject var updateFavs: updateFavourites
    @ObservedObject var categoryToEdit: FavCat
    @EnvironmentObject var popupController: PopupController
    @Environment(\.managedObjectContext) private var viewContext
    let columns = fiveColumnGrid
        
    var body: some View {
        ZStack {
            Color.customBackgroundGray.ignoresSafeArea()
            
            //MARK: Header
            VStack {
                Text("Category Builder")
                    .font(.system(size: 36, weight: .medium))
                    .foregroundColor(.customForegroundGold)
                    .padding(.top, 16)
                HStack(spacing: 0) {
                    Rectangle()
                        .fill(Color.customForegroundGold)
                        .frame(height: 1)
                    Image("Logo")
                        .resizable()
                        .scaledToFit()
                        .frame(width: 100, height: 100)
                    Rectangle()
                        .fill(Color.customForegroundGold)
                        .frame(height: 1)
                     }
                
                //Back and confirm deck buttons
                HStack {
                    Button( action: {
                        dismiss()
                    }) {
                        HStack {
                            Image(systemName: "arrow.left")
                                .padding(.horizontal, 16)
                                .foregroundColor(.customForegroundGold)
                            Text("Back")
                                .foregroundColor(.customForegroundGold)
                        }
                    }
                    
                    Spacer()
                    
                    Button(action : {
                        withAnimation {
                            popupController.message = "Category edited successfully"
                            popupController.showPopup = true
                        }
                        if categoryToEdit.icon != "" {
                            categoryToEdit.color = selectedColor

                            do {
                                try viewContext.save()   // ✅ use the environment context
                            } catch {
                                print("Error saving: \(error.localizedDescription)")
                            }
                            
                            updateFavs.updateVar += 1
                            dismiss()
                        }
                    })
                    {
                        HStack {
                            if (categoryToEdit.icon != "") {
                                Text("Confirm Category")
                                    .foregroundColor(.customForegroundGold)
                                Image(systemName: "checkmark")
                                    .foregroundColor(.customForegroundGold)
                            } else {
                                Text("Confirm Category")
                                    .foregroundColor(Color.black.opacity(0.2))
                                Image(systemName: "checkmark")
                                    .foregroundColor(Color.black.opacity(0.2))
                            }
                        }
                        .padding(.horizontal, 16)
                    }
                    
                }
                
                Button(action: {
                    withAnimation {
                        popupController.message = "Category deleted successfully"
                        popupController.showPopup = true
                    }

                    viewContext.delete(categoryToEdit)   // ✅ same context

                    do {
                        try viewContext.save()
                    } catch {
                        print("Error deleting item: \(error.localizedDescription)")
                    }

                    updateFavs.updateVar += 1
                    dismiss()
                })
{
                    HStack {
                        Text("Delete Category")
                            .foregroundColor(.customForegroundGold)
                        Image(systemName: "trash")
                            .foregroundColor(.customForegroundGold)
                    }
                    .padding(.top, 16)
                }
                
                //deck name text field
                TextField(
                    "",
                    text: Binding(
                        get: { categoryToEdit.name ?? "" },
                        set: { newValue in
                            categoryToEdit.name = newValue.isEmpty ? nil : newValue
                        }
                    ),
                    prompt: Text("My Favourite Category")
                        .foregroundColor(.customForegroundGold)
                )
                .background(Color.black.opacity(0.2))
                .foregroundColor(.customForegroundGold)
                .frame(width: 200)
                .cornerRadius(8)
                .multilineTextAlignment(.center)
                .padding(.vertical, 8)

                
                Picker("Select a Color", selection: $selectedColor) {
                    ForEach(colorOptions, id: \.self) { color in
                        Text(color)
                            .foregroundColor(.customForegroundGold)
                            .tag(color)
                    }
                }
                .pickerStyle(DefaultPickerStyle())
                
                //MARK: Category icons
                ScrollView {
                    LazyVGrid(columns: columns, spacing: 1) {
                        ForEach(1..<24) { i in //Replace with number of avaialable category icons
                            Button(action: {
                                categoryToEdit.icon = "Category_Icon_" + String(i)
                                
                            }) {
                                ZStack {
                                    Image("Category_Icon_" + String(i))
                                        .resizable()
                                        .scaledToFit()
                                        .frame(width: 50, height: 50)
                                    if categoryToEdit.icon == "Category_Icon_" + String(i) {
                                        Color.green.opacity(0.4)
                                            .cornerRadius(12)
                                    }
                                }
                            }
                        }
                    }
                }
                
                
                Spacer()
            }
        }
        .navigationBarBackButtonHidden(true)
        .onAppear {
            selectedColor = categoryToEdit.color ?? "none"
        }
    }
}

#Preview {
    let context = PersistenceController.shared.container.viewContext
    let sampleCategory = FavCat(context: context)

    return CategoryEditorView(
        updateFavs: updateFavourites(),
        categoryToEdit: sampleCategory
    )
    .environment(\.managedObjectContext, context)
}


