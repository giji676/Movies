from django.urls import path
from . import views

urlpatterns = [
    path("create/", views.CreateRoomView.as_view(), name="create-room"),
    path("join/<room_hash>/", views.JoinRoomView.as_view(), name="join-room"),
    path("<room_hash>/users/", views.ManagerUsersInRoom.as_view(), name="manage-user"),
    path("<room_hash>/users/<int:user_id>/", views.ManagerUsersInRoom.as_view(), name="manage-user-detail")
]
