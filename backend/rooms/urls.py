from django.urls import path
from . import views

urlpatterns = [
    path("create/", views.CreateRoomView.as_view(), name="create-room"),
    path("add-user/", views.AddUserToRoom.as_view(), name="add-user"),
]
